import { ModelInfo, ModelMode, ProviderType } from '../types/index.ts';
import { ModelStore } from './modelStore.ts';

export type TaskType = 'CODING' | 'REASONING' | 'VISION' | 'GENERAL';

export class ModelRouter {
  constructor(private modelStore: ModelStore) {}

  public analyzeTask(messages: { role: string; content: string; attachments?: any[] }[]): TaskType {
    if (!messages || messages.length === 0) return 'GENERAL';
    const lastMsg = messages[messages.length - 1];
    
    // Vision check
    if (lastMsg.attachments && lastMsg.attachments.some((a: any) => a.type && a.type.startsWith('image/'))) {
      return 'VISION';
    }

    const text = (lastMsg.content || '').toLowerCase();

    // Coding check
    if (
      text.includes('code') || 
      text.includes('function') || 
      text.includes('typescript') || 
      text.includes('javascript') || 
      text.includes('python') || 
      text.includes('class') || 
      text.includes('refactor') || 
      text.includes('debug') ||
      text.includes('git') ||
      text.includes('const ') ||
      text.includes('import ')
    ) {
      return 'CODING';
    }

    // Reasoning check
    if (
      text.includes('explain') || 
      text.includes('why') || 
      text.includes('proof') || 
      text.includes('compare') || 
      text.includes('calculate') || 
      text.includes('logic') || 
      text.includes('summarize') || 
      text.includes('architecture') ||
      text.includes('trade-off')
    ) {
      return 'REASONING';
    }

    return 'GENERAL';
  }

  public selectModel(
    mode: ModelMode,
    messages: { role: string; content: string; attachments?: any[] }[],
    options: {
      requestedModelId?: string;
      requestedProvider?: ProviderType;
      availableProviders?: Record<string, boolean>;
    }
  ): { model: ModelInfo; provider: ProviderType } {
    const allModels = this.modelStore.getAllModels();
    if (allModels.length === 0) {
      throw new Error('No models available in catalog. Please synchronize models.');
    }

    // 1. MANUAL MODE
    if (mode === 'MANUAL' && options.requestedModelId) {
      const match = this.modelStore.getModelById(options.requestedModelId);
      if (match) {
        return { model: match, provider: match.provider };
      }
    }

    // 2. Specific mode filters
    const task = this.analyzeTask(messages);

    let candidates = allModels.filter(m => m.status !== 'offline');

    if (mode === 'FREE') {
      candidates = candidates.filter(m => m.isFree);
    } else if (mode === 'CODING' || task === 'CODING') {
      const coding = candidates.filter(m => m.supportsCoding);
      if (coding.length > 0) candidates = coding;
    } else if (mode === 'REASONING' || task === 'REASONING') {
      const reasoning = candidates.filter(m => m.supportsReasoning);
      if (reasoning.length > 0) candidates = reasoning;
    } else if (mode === 'VISION' || task === 'VISION') {
      const vision = candidates.filter(m => m.supportsVision);
      if (vision.length > 0) candidates = vision;
    }

    // Filter available providers if keys checked
    if (options.availableProviders) {
      const providerFiltered = candidates.filter(m => options.availableProviders?.[m.provider]);
      if (providerFiltered.length > 0) candidates = providerFiltered;
    }

    if (candidates.length === 0) candidates = allModels;

    // Pick top candidate
    // Prefer GLM / Free / Gemini Flash
    candidates.sort((a, b) => {
      if (a.isGlm && !b.isGlm) return -1;
      if (!a.isGlm && b.isGlm) return 1;
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;
      return b.contextLength - a.contextLength;
    });

    const chosen = candidates[0];
    return { model: chosen, provider: chosen.provider };
  }

  public getFallbackCandidate(
    failedModelId: string,
    failedProvider: ProviderType,
    level: 1 | 2 | 3,
    task: TaskType,
    availableProviders?: Record<string, boolean>
  ): ModelInfo | null {
    const allModels = this.modelStore.getAllModels();

    if (level === 1) {
      // Same provider alternative
      const sameProv = allModels.filter(m => m.provider === failedProvider && m.id !== failedModelId && m.status === 'available');
      if (sameProv.length > 0) return sameProv[0];
    }

    if (level === 2) {
      // Cross provider candidate
      const otherProv = allModels.filter(m => m.provider !== failedProvider && m.status === 'available' && availableProviders?.[m.provider]);
      if (otherProv.length > 0) return otherProv[0];
    }

    if (level === 3) {
      // Gemini final resilient gateway
      const geminiModel = allModels.find(m => m.provider === 'gemini' && m.id !== failedModelId);
      if (geminiModel) return geminiModel;
    }

    return null;
  }
}
