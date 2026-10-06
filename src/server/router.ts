import { ModelInfo, ModelMode, ProviderType } from '../types/index.ts';
import { ModelStore } from './modelStore.ts';

export type TaskType = 'CODING' | 'REASONING' | 'VISION' | 'GENERAL';

export class ModelRouter {
  constructor(private modelStore: ModelStore) {}

  public analyzeTask(messages: { role: string; content: string; attachments?: any[] }[]): TaskType {
    if (!messages || messages.length === 0) return 'GENERAL';
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.attachments?.some((a: any) => a.type?.startsWith('image/'))) return 'VISION';
    const text = (lastMsg.content || '').toLowerCase();
    if (/\b(code|function|typescript|javascript|python|class|refactor|debug|git|const|import)\b/.test(text) || /```/.test(text)) return 'CODING';
    if (/\b(explain|why|proof|compare|calculate|logic|architecture|trade[- ]off|derive|solve)\b/.test(text)) return 'REASONING';
    return 'GENERAL';
  }

  private filterForTask(models: ModelInfo[], task: TaskType): ModelInfo[] {
    if (task === 'CODING') { const matches = models.filter(m => m.supportsCoding); return matches.length ? matches : models; }
    if (task === 'REASONING') { const matches = models.filter(m => m.supportsReasoning); return matches.length ? matches : models; }
    if (task === 'VISION') { const matches = models.filter(m => m.supportsVision); return matches.length ? matches : models; }
    return models;
  }

  private rankCandidates(models: ModelInfo[], task: TaskType): ModelInfo[] {
    return [...models].sort((a, b) => {
      const score = (m: ModelInfo) => {
        let value = 0;
        if (task === 'CODING' && m.supportsCoding) value += 100;
        if (task === 'REASONING' && m.supportsReasoning) value += 100;
        if (task === 'VISION' && m.supportsVision) value += 100;
        if (m.supportsStreaming) value += 15;
        if (m.supportsTools) value += 10;
        if (m.isFree) value += 5;
        if (m.isGlm) value += 3;
        value += Math.min(m.contextLength / 100000, 20);
        return value;
      };
      return score(b) - score(a);
    });
  }

  public selectModel(mode: ModelMode, messages: { role: string; content: string; attachments?: any[] }[], options: { requestedModelId?: string; requestedProvider?: ProviderType; availableProviders?: Record<string, boolean>; }): { model: ModelInfo; provider: ProviderType } {
    const allModels = this.modelStore.getAllModels();
    if (allModels.length === 0) throw new Error('No models available in catalog. Please synchronize models.');

    if (mode === 'MANUAL') {
      if (!options.requestedModelId) throw new Error('Manual mode requires a model selection.');
      const match = this.modelStore.getModelById(options.requestedModelId);
      if (!match) throw new Error('Selected model is not available in the current catalog.');
      if (options.requestedProvider && match.provider !== options.requestedProvider) throw new Error('Selected model belongs to a different provider.');
      if (options.availableProviders && !options.availableProviders[match.provider]) throw new Error('Selected provider is not configured or available.');
      return { model: match, provider: match.provider };
    }

    const task = this.analyzeTask(messages);
    let candidates = allModels.filter(m => m.status !== 'offline');
    if (options.availableProviders) {
      candidates = candidates.filter(m => options.availableProviders?.[m.provider]);
      if (!candidates.length) throw new Error('No configured AI provider is available. Add an API key in Settings -> Providers.');
    }
    if (mode === 'FREE') {
      candidates = candidates.filter(m => m.isFree);
      if (!candidates.length) throw new Error('No free models are currently available.');
    }
    if (mode === 'CODING' || task === 'CODING') candidates = this.filterForTask(candidates, 'CODING');
    else if (mode === 'REASONING' || task === 'REASONING') candidates = this.filterForTask(candidates, 'REASONING');
    else if (mode === 'VISION' || task === 'VISION') candidates = this.filterForTask(candidates, 'VISION');

    const chosen = this.rankCandidates(candidates, task)[0];
    if (!chosen) throw new Error('No compatible model is available for this request.');
    return { model: chosen, provider: chosen.provider };
  }

  public getFallbackCandidate(failedModelId: string, failedProvider: ProviderType, level: 1 | 2 | 3, task: TaskType, availableProviders?: Record<string, boolean>): ModelInfo | null {
    const allModels = this.modelStore.getAllModels().filter(m => m.id !== failedModelId && m.status !== 'offline' && (!availableProviders || availableProviders[m.provider]));
    const compatible = this.filterForTask(allModels, task);
    if (level === 1) return this.rankCandidates(compatible.filter(m => m.provider === failedProvider), task)[0] || null;
    if (level === 2) return this.rankCandidates(compatible.filter(m => m.provider !== failedProvider), task)[0] || null;
    if (level === 3) return this.rankCandidates(compatible.filter(m => m.provider === 'gemini'), task)[0] || null;
    return null;
  }
}