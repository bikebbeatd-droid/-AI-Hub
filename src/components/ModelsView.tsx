import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  RefreshCw, 
  Sparkles, 
  Star, 
  Check, 
  Zap, 
  Brain, 
  Code, 
  Eye, 
  Gift, 
  Sliders, 
  ExternalLink,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';
import { ModelInfo, ProviderType } from '../types/index.ts';

export const ModelsView: React.FC = () => {
  const {
    models,
    syncStatus,
    refreshModels,
    selectModel,
    selectedModelId,
    favorites,
    toggleFavorite,
    setTestingModel
  } = useHub();

  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setFilterProvider] = useState<'all' | ProviderType>('all');
  const [capabilityFilter, setFilterCapability] = useState<'all' | 'free' | 'glm' | 'coding' | 'reasoning' | 'vision'>('all');

  const filteredModels = models.filter(m => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = m.displayName.toLowerCase().includes(query) ||
                          m.id.toLowerCase().includes(query) ||
                          m.description.toLowerCase().includes(query) ||
                          m.ownedBy.toLowerCase().includes(query);

    if (!matchesSearch) return false;
    if (providerFilter !== 'all' && m.provider !== providerFilter) return false;

    if (capabilityFilter === 'free') return m.isFree;
    if (capabilityFilter === 'glm') return m.isGlm;
    if (capabilityFilter === 'coding') return m.supportsCoding;
    if (capabilityFilter === 'reasoning') return m.supportsReasoning;
    if (capabilityFilter === 'vision') return m.supportsVision;

    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            <span>AI Model Directory &amp; Catalog</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Synchronized live from OpenRouter, NVIDIA NIM, and Gemini endpoints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {syncStatus.lastSynced && (
            <span className="text-xs text-neutral-400 font-mono hidden md:inline">
              Last synced: {new Date(syncStatus.lastSynced).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => refreshModels()}
            disabled={syncStatus.isSyncing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs sm:text-sm transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
            <span>{syncStatus.isSyncing ? 'Synchronizing...' : 'Refresh Models'}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/40 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, or architecture..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm text-neutral-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={e => setFilterProvider(e.target.value as any)}
            className="py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 outline-none cursor-pointer"
          >
            <option value="all">All Providers</option>
            <option value="openrouter">OpenRouter</option>
            <option value="nvidia">NVIDIA NIM</option>
            <option value="gemini">Google Gemini</option>
          </select>

          {/* Capability Filter */}
          <select
            value={capabilityFilter}
            onChange={e => setFilterCapability(e.target.value as any)}
            className="py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 outline-none cursor-pointer"
          >
            <option value="all">All Capabilities</option>
            <option value="free">Free Tier Only</option>
            <option value="glm">GLM Foundation</option>
            <option value="coding">Coding &amp; Refactoring</option>
            <option value="reasoning">Advanced Reasoning</option>
            <option value="vision">Vision &amp; Multimodal</option>
          </select>

          <span className="text-neutral-400 font-mono text-xs ml-auto">
            {filteredModels.length} of {models.length} models
          </span>
        </div>
      </div>

      {/* Grid List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map(model => {
            const isSelected = selectedModelId === model.id;
            const isFav = favorites.includes(model.id);

            return (
              <div 
                key={model.id}
                className={`bg-white dark:bg-neutral-900 rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                  isSelected 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <span>{model.displayName}</span>
                        {model.isGlm && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
                            GLM
                          </span>
                        )}
                        {model.isFree && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                            Free
                          </span>
                        )}
                      </h3>
                      <div className="text-[11px] font-mono text-neutral-400 truncate max-w-[220px]">
                        {model.id}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFavorite(model.id)}
                      className={`p-1 rounded cursor-pointer ${isFav ? 'text-amber-500' : 'text-neutral-300 hover:text-neutral-500'}`}
                      title={isFav ? 'Remove Favorite' : 'Mark Favorite'}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 my-2 leading-relaxed">
                    {model.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 my-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      {(model.contextLength / 1024).toFixed(0)}k Context
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      {model.provider}
                    </span>
                    {model.supportsCoding && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
                        Coding
                      </span>
                    )}
                    {model.supportsReasoning && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
                        Reasoning
                      </span>
                    )}
                    {model.supportsVision && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-400">
                        Vision
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setTestingModel(model)}
                    className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium cursor-pointer"
                  >
                    Test Latency
                  </button>

                  <button
                    onClick={() => selectModel(model.id, 'MANUAL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : 'Select Model'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
