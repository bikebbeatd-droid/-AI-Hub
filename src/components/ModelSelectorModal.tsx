import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Sparkles, 
  Zap, 
  Brain, 
  Code, 
  Eye, 
  Gift, 
  Cpu,
  Check,
  Star,
  Layers
} from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';
import { ModelMode } from '../types/index.ts';

const MODES: { id: ModelMode; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'AUTO', label: 'Auto Intelligent', desc: 'Dynamic intent matching & resilient fallback', icon: <Sparkles className="w-4 h-4 text-blue-500" /> },
  { id: 'CODING', label: 'Coding & Development', desc: 'Optimized for Qwen Coder, DeepSeek & Code Llama', icon: <Code className="w-4 h-4 text-cyan-500" /> },
  { id: 'REASONING', label: 'Logic & Reasoning', desc: 'R1, Chain-of-Thought, and complex math proofs', icon: <Brain className="w-4 h-4 text-indigo-500" /> },
  { id: 'VISION', label: 'Multimodal Vision', desc: 'Analyzes visual diagrams, images & screenshots', icon: <Eye className="w-4 h-4 text-pink-500" /> },
  { id: 'FREE', label: 'Free Tier Models', desc: 'Strictly zero-cost models across providers', icon: <Gift className="w-4 h-4 text-emerald-500" /> },
  { id: 'FAST', label: 'Low Latency', desc: 'Optimized for instant low-latency responses', icon: <Zap className="w-4 h-4 text-amber-500" /> }
];

export const ModelSelectorModal: React.FC = () => {
  const { 
    isModelSelectorOpen, 
    setIsModelSelectorOpen, 
    currentMode, 
    setMode, 
    models, 
    selectedModelId, 
    selectedModelIds,
    toggleSelectedModelId,
    clearSelectedModelIds,
    selectModel,
    isEnsembleMode,
    setIsEnsembleMode,
    favorites
  } = useHub();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'modes' | 'manual' | 'multi'>('modes');

  if (!isModelSelectorOpen) return null;

  const filteredModels = models.filter(m => 
    m.displayName.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div 
      onClick={() => setIsModelSelectorOpen(false)}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold text-base text-neutral-900 dark:text-white">
              Select AI Models &amp; Routing Mode
            </h2>
          </div>
          <button 
            onClick={() => setIsModelSelectorOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 p-1 text-xs">
          <button
            onClick={() => setActiveTab('modes')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'modes' 
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Routing Modes
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'manual' 
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Single Model ({models.length})
          </button>

          <button
            onClick={() => setActiveTab('multi')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'multi' 
                ? 'bg-purple-600 text-white shadow-xs font-bold' 
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Model ({selectedModelIds.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'modes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MODES.map(m => {
                const isActive = currentMode === m.id && !selectedModelId && !isEnsembleMode;

                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      selectModel(null);
                      setMode(m.id);
                      setIsEnsembleMode(false);
                      setIsModelSelectorOpen(false);
                    }}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 ring-2 ring-blue-500/20' 
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0">
                      {m.icon}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <span>{m.label}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {m.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter models by name or provider ID..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                {filteredModels.map(m => {
                  const isSelected = selectedModelId === m.id;
                  const isFav = favorites.includes(m.id);

                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        selectModel(m.id, 'MANUAL');
                        setIsEnsembleMode(false);
                        setIsModelSelectorOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 font-semibold' 
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-neutral-900 dark:text-white truncate flex items-center gap-1.5">
                          <span>{m.displayName}</span>
                          {isFav && <Star className="w-3 h-3 text-amber-500 fill-current shrink-0" />}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400 truncate">
                          {m.id}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {m.supportsVision && <span className="text-[9px] font-bold px-1 rounded bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-300">VISION</span>}
                        {m.supportsCoding && <span className="text-[9px] font-bold px-1 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-300">CODING</span>}
                        {m.supportsReasoning && <span className="text-[9px] font-bold px-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">R1</span>}
                        {m.isFree && <span className="text-[9px] font-bold px-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">FREE</span>}
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                          {m.provider}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'multi' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Multi-Model Simultaneous Execution</div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    Select 2 or more models across Google Gemini, OpenRouter, and NVIDIA NIM to query them in parallel and synthesize consensus answers.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Select Models ({selectedModelIds.length} chosen)
                </span>
                {selectedModelIds.length > 0 && (
                  <button
                    onClick={clearSelectedModelIds}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter models for multi-select..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {filteredModels.map(m => {
                  const isChecked = selectedModelIds.includes(m.id);

                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleSelectedModelId(m.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isChecked 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 font-semibold' 
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by parent div
                          className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-neutral-900 dark:text-white truncate">
                            {m.displayName}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400 truncate">
                            {m.id}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shrink-0">
                        {m.provider}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setIsEnsembleMode(true);
                  setIsModelSelectorOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Enable Multi-Model Consensus Mode</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              selectModel(null, 'AUTO');
              setIsEnsembleMode(false);
              clearSelectedModelIds();
              setIsModelSelectorOpen(false);
            }}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
          >
            Reset to Default Auto
          </button>
          <button
            onClick={() => setIsModelSelectorOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
