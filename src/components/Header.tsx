import React from 'react';
import { 
  Menu, 
  ChevronDown, 
  Sparkles, 
  Sun, 
  Moon, 
  Settings, 
  Zap, 
  Code, 
  Brain, 
  Eye, 
  Gift, 
  Cpu
} from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';
import { ModelMode } from '../types/index.ts';

const MODE_ICONS: Record<ModelMode, React.ReactNode> = {
  AUTO: <Sparkles className="w-3.5 h-3.5 text-blue-500" />,
  BEST: <Cpu className="w-3.5 h-3.5 text-purple-500" />,
  FAST: <Zap className="w-3.5 h-3.5 text-amber-500" />,
  FREE: <Gift className="w-3.5 h-3.5 text-emerald-500" />,
  CODING: <Code className="w-3.5 h-3.5 text-cyan-500" />,
  REASONING: <Brain className="w-3.5 h-3.5 text-indigo-500" />,
  VISION: <Eye className="w-3.5 h-3.5 text-pink-500" />,
  MANUAL: <Cpu className="w-3.5 h-3.5 text-neutral-500" />
};

export const Header: React.FC = () => {
  const { 
    isSidebarOpen, 
    setIsSidebarOpen, 
    currentMode, 
    selectedModel, 
    selectedModelId,
    setIsModelSelectorOpen,
    theme,
    setTheme,
    setActiveTab,
    syncStatus
  } = useHub();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Determine selector label
  let selectorLabel: string = currentMode;
  let subLabel = 'Intelligent Routing';
  let providerBadge = '';

  if (selectedModel) {
    selectorLabel = selectedModel.displayName;
    subLabel = selectedModel.id;
    providerBadge = selectedModel.provider.toUpperCase();
  } else if (selectedModelId) {
    selectorLabel = selectedModelId;
    subLabel = 'Custom Selection';
  } else if (currentMode === 'AUTO') {
    selectorLabel = 'Auto';
    subLabel = 'Dynamic Intent Match';
  } else if (currentMode === 'FREE') {
    selectorLabel = 'Free Models';
    subLabel = `${syncStatus.freeModelsCount} Available`;
  }

  return (
    <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-3 md:px-5 flex items-center justify-between sticky top-0 z-20">
      {/* Mobile Hamburger & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button 
          onClick={() => setActiveTab('chat')} 
          className="text-left font-bold text-base md:text-lg tracking-tight text-neutral-900 dark:text-white flex items-center gap-2 group cursor-pointer"
        >
          <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-mono shadow-xs font-extrabold">
            AI
          </span>
          <span>AI Hub</span>
        </button>
      </div>

      {/* Model & Mode Selector Trigger */}
      <div className="flex items-center">
        <button
          onClick={() => setIsModelSelectorOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all text-neutral-800 dark:text-neutral-200 shadow-xs cursor-pointer group max-w-[200px] sm:max-w-xs md:max-w-sm"
          aria-label="Select AI Model or Mode"
        >
          <div className="shrink-0">
            {selectedModel ? (
              <span className={`w-2 h-2 rounded-full ${selectedModel.isGlm ? 'bg-red-500' : selectedModel.isFree ? 'bg-emerald-500' : 'bg-blue-500'} inline-block`} />
            ) : (
              MODE_ICONS[currentMode] || <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            )}
          </div>

          <div className="flex flex-col text-left truncate">
            <span className="text-xs font-bold leading-tight truncate">
              {selectorLabel}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono leading-tight truncate">
              {subLabel}
            </span>
          </div>

          {providerBadge && (
            <span className="hidden sm:inline-block text-[9px] font-mono uppercase font-semibold px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 ml-1 shrink-0">
              {providerBadge}
            </span>
          )}

          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 shrink-0 ml-1" />
        </button>
      </div>

      {/* Quick Utilities */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
