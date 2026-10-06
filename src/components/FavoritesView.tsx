import React from 'react';
import { Star, Sparkles, Database, Trash2 } from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';

export const FavoritesView: React.FC = () => {
  const { models, favorites, toggleFavorite, selectModel, selectedModelId } = useHub();

  const favoriteModels = models.filter(m => favorites.includes(m.id));

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 backdrop-blur-xs">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-current" />
          <span>Favorite Models</span>
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
          Quick access to your preferred foundation models across OpenRouter, NVIDIA, and Gemini.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {favoriteModels.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Star className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-3" />
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">No favorite models starred</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Star models from the Models tab to pin them here for rapid manual selection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {favoriteModels.map(model => (
              <div 
                key={model.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {model.displayName}
                    </h3>
                    <button 
                      onClick={() => toggleFavorite(model.id)}
                      className="text-amber-500 hover:text-neutral-400 p-1 cursor-pointer"
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400 mb-2 truncate">
                    {model.id}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                    {model.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between mt-3">
                  <span className="text-[11px] font-mono uppercase text-neutral-400">
                    {model.provider}
                  </span>
                  <button
                    onClick={() => selectModel(model.id, 'MANUAL')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                  >
                    Select Model
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
