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
      freeOnly?: boolean;
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
        if (options.freeOnly && !match.isFree) {
          throw new Error(`Model ${match.displayName} requires a paid plan, but Free Only mode is enabled.`);
        }
        return { model: match, provider: match.provider };
      }
    }

    // 2. Specific mode filters & Task Analysis
    const task = this.analyzeTask(messages);
    const isFreeRequired = mode === 'FREE' || options.freeOnly === true;

    let candidates = allModels.filter(m => m.status !== 'offline' && m.status !== 'degraded');
    if (candidates.length === 0) {
      candidates = allModels.filter(m => m.status !== 'offline');
    }

    // Enforce FREE ONLY if requested
    if (isFreeRequired) {
      candidates = candidates.filter(m => m.isFree);
      if (candidates.length === 0) {
        throw new Error('No eligible free model is currently available for this task.');
      }
    }

    if (mode === 'CODING' || task === 'CODING') {
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

    if (candidates.length === 0) {
      if (isFreeRequired) {
        throw new Error('No eligible free model is currently available for this task with active provider keys.');
      }
      candidates = allModels;
    }

    // List of proven ultra-reliable flagship models
    const RELIABLE_PREFIXES = [
      'gemini-2.5-flash',
      'google/gemini-2.5-flash',
      'meta-llama/llama-3.3-70b',
      'qwen/qwen-2.5-coder',
      'z-ai/glm',
      'deepseek/deepseek-r1'
    ];

    const getReliabilityScore = (m: ModelInfo) => {
      const lower = m.id.toLowerCase();
      if (m.provider === 'gemini') return 100;
      if (RELIABLE_PREFIXES.some(p => lower.includes(p))) return 80;
      if (m.isGlm) return 70;
      if (m.isFree) return 50;
      return 10;
    };

    // Pick top candidate
    candidates.sort((a, b) => {
      const scoreA = getReliabilityScore(a);
      const scoreB = getReliabilityScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;
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
    availableProviders?: Record<string, boolean>,
    options?: { freeOnly?: boolean; requiredCapability?: 'coding' | 'vision' | 'image' | 'reasoning' }
  ): ModelInfo | null {
    let candidates = this.modelStore.getAllModels().filter(m => m.id !== failedModelId && m.status !== 'degraded' && m.status !== 'offline');

    if (options?.freeOnly) {
      candidates = candidates.filter(m => m.isFree);
    }

    if (options?.requiredCapability === 'coding' || task === 'CODING') {
      const filtered = candidates.filter(m => m.supportsCoding);
      if (filtered.length > 0) candidates = filtered;
    } else if (options?.requiredCapability === 'vision' || task === 'VISION') {
      const filtered = candidates.filter(m => m.supportsVision);
      if (filtered.length > 0) candidates = filtered;
    } else if (options?.requiredCapability === 'reasoning' || task === 'REASONING') {
      const filtered = candidates.filter(m => m.supportsReasoning);
      if (filtered.length > 0) candidates = filtered;
    } else if (options?.requiredCapability === 'image') {
      const filtered = candidates.filter(m => m.supportsImageOutput);
      if (filtered.length > 0) candidates = filtered;
    }

    const rankModel = (m: ModelInfo) => {
      const id = m.id.toLowerCase();
      if (m.provider === 'gemini') return 100;
      if (id.includes('llama-3.3-70b') || id.includes('qwen-2.5-coder') || id.includes('deepseek-r1') || id.includes('gemini')) return 90;
      if (m.isFree) return 70;
      return 50;
    };

    if (level === 1) {
      // Same provider alternative sorted by reliability
      const sameProv = candidates
        .filter(m => m.provider === failedProvider)
        .sort((a, b) => rankModel(b) - rankModel(a));
      if (sameProv.length > 0) return sameProv[0];
    }

    if (level === 2) {
      // Cross provider candidate sorted by reliability
      const otherProv = candidates
        .filter(m => m.provider !== failedProvider && (availableProviders ? availableProviders[m.provider] : true))
        .sort((a, b) => rankModel(b) - rankModel(a));
      if (otherProv.length > 0) return otherProv[0];
    }

    if (level === 3) {
      // Gemini final resilient gateway
      const geminiCandidate = candidates.find(m => m.provider === 'gemini');
      if (geminiCandidate) return geminiCandidate;
    }

    return null;
  }
}
