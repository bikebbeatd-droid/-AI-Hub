import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ModelInfo, ProviderType, SyncStatus } from '../types/index.ts';
import { OpenRouterAdapter } from './adapters/openrouter.ts';
import { NvidiaAdapter } from './adapters/nvidia.ts';
import { GeminiAdapter } from './adapters/gemini.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.resolve(__dirname, '../../.models-cache.json');

export class ModelStore {
  private models: Map<string, ModelInfo> = new Map();
  private openrouterAdapter = new OpenRouterAdapter();
  private nvidiaAdapter = new NvidiaAdapter();
  private geminiAdapter = new GeminiAdapter();

  private syncStatus: SyncStatus = {
    lastSynced: null,
    isSyncing: false,
    totalModels: 0,
    glmModelsCount: 0,
    freeModelsCount: 0
  };

  private healthStats: Map<string, { failures: number; totalLatencyMs: number; calls: number }> = new Map();

  constructor() {
    this.loadFromCache();
  }

  private loadFromCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.models)) {
          for (const m of data.models) this.models.set(m.id, m);
        }
        if (data.status) this.syncStatus = data.status;
      }
    } catch (e) {
      console.warn('Could not load model cache from disk:', e);
    }
  }

  private saveToCache() {
    try {
      fs.writeFileSync(
        CACHE_FILE,
        JSON.stringify({
          models: Array.from(this.models.values()),
          status: this.syncStatus
        }, null, 2),
        'utf-8'
      );
    } catch (e) {
      console.warn('Failed to save model cache:', e);
    }
  }

  public getAllModels(): ModelInfo[] {
    return Array.from(this.models.values());
  }

  public getModelById(id: string): ModelInfo | undefined {
    return this.models.get(id);
  }

  public getStatus(): SyncStatus {
    return this.syncStatus;
  }

  public recordSuccess(modelId: string, provider: ProviderType, latencyMs: number) {
    const stats = this.healthStats.get(modelId) || { failures: 0, totalLatencyMs: 0, calls: 0 };
    stats.calls += 1;
    stats.totalLatencyMs += latencyMs;
    stats.failures = Math.max(0, stats.failures - 1);
    this.healthStats.set(modelId, stats);

    const model = this.models.get(modelId);
    if (model && model.status !== 'available') {
      model.status = 'available';
      this.saveToCache();
    }
  }

  public recordFailure(modelId: string, provider: ProviderType, errorMsg?: string) {
    const stats = this.healthStats.get(modelId) || { failures: 0, totalLatencyMs: 0, calls: 0 };
    stats.failures += 1;
    this.healthStats.set(modelId, stats);

    const model = this.models.get(modelId);
    if (model && stats.failures >= 2) {
      model.status = 'degraded';
      this.saveToCache();
    }
  }

  public async syncAll(keys?: { openrouter?: string; nvidia?: string; gemini?: string }): Promise<SyncStatus> {
    this.syncStatus.isSyncing = true;
    this.syncStatus.error = null;

    const openrouterKey = keys?.openrouter || process.env.OPENROUTER_API_KEY;
    const nvidiaKey = keys?.nvidia || process.env.NVIDIA_API_KEY;

    const results = await Promise.allSettled([
      this.openrouterAdapter.listModels(openrouterKey),
      this.nvidiaAdapter.listModels(nvidiaKey),
      this.geminiAdapter.listModels()
    ]);

    const errors: string[] = [];
    const successfulModels: ModelInfo[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulModels.push(...result.value);
      } else {
        const provider = index === 0 ? 'OpenRouter' : index === 1 ? 'NVIDIA NIM' : 'Gemini';
        errors.push(provider + ': ' + (result.reason?.message || 'catalog sync failed'));
      }
    });

    // Only replace models for providers whose catalog request succeeded.
    // This prevents a temporary outage from wiping a previously healthy catalog.
    const successfulProviders = new Set(
      results
        .map((result, index) => result.status === 'fulfilled' ? (index === 0 ? 'openrouter' : index === 1 ? 'nvidia' : 'gemini') : null)
        .filter(Boolean)
    );

    if (successfulProviders.size > 0) {
      for (const provider of successfulProviders) {
        for (const [id, model] of this.models) {
          if (model.provider === provider) this.models.delete(id);
        }
      }
      for (const model of successfulModels) this.models.set(model.id, model);
    }

    const all = Array.from(this.models.values());
    this.syncStatus = {
      lastSynced: new Date().toISOString(),
      isSyncing: false,
      totalModels: all.length,
      glmModelsCount: all.filter(m => m.isGlm).length,
      freeModelsCount: all.filter(m => m.isFree).length,
      error: errors.length ? errors.join(' | ') : null
    };

    this.saveToCache();
    return this.syncStatus;
  }
}
