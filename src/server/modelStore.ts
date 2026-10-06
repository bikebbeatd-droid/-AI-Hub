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
          for (const m of data.models) {
            this.models.set(m.id, m);
          }
        }
        if (data.status) {
          this.syncStatus = data.status;
        }
      }
    } catch (e) {
      console.warn('Could not load model cache from disk:', e);
    }
  }

  private saveToCache() {
    try {
      const data = {
        models: Array.from(this.models.values()),
        status: this.syncStatus
      };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
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

    try {
      const openrouterKey = keys?.openrouter || process.env.OPENROUTER_API_KEY;
      const nvidiaKey = keys?.nvidia || process.env.NVIDIA_API_KEY;

      const [orModels, nvModels, gemModels] = await Promise.all([
        this.openrouterAdapter.listModels(openrouterKey),
        this.nvidiaAdapter.listModels(nvidiaKey),
        this.geminiAdapter.listModels()
      ]);

      const newMap = new Map<string, ModelInfo>();

      for (const m of [...orModels, ...nvModels, ...gemModels]) {
        newMap.set(m.id, m);
      }

      this.models = newMap;

      const all = Array.from(this.models.values());
      const glmCount = all.filter(m => m.isGlm).length;
      const freeCount = all.filter(m => m.isFree).length;

      this.syncStatus = {
        lastSynced: new Date().toISOString(),
        isSyncing: false,
        totalModels: all.length,
        glmModelsCount: glmCount,
        freeModelsCount: freeCount
      };

      this.saveToCache();
      return this.syncStatus;
    } catch (err: any) {
      this.syncStatus.isSyncing = false;
      this.syncStatus.error = err.message || 'Synchronization failed';
      throw err;
    }
  }
}
