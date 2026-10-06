import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';

export const ShortcutsHelpModal: React.FC = () => {
  const { isShortcutsHelpOpen, setIsShortcutsHelpOpen } = useHub();

  if (!isShortcutsHelpOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { key: `${modKey} + N`, action: 'New Chat', desc: 'Create a fresh conversation session' },
    { key: `${modKey} + B`, action: 'Toggle Sidebar', desc: 'Expand or collapse navigation drawer' },
    { key: `${modKey} + I`, action: 'Focus Composer', desc: 'Jump directly to message input' },
    { key: `${modKey} + /`, action: 'Shortcuts Help', desc: 'Display this keyboard shortcut guide' },
    { key: 'Shift + Enter', action: 'New Line', desc: 'Insert line break in composer' },
    { key: 'Enter', action: 'Send Message', desc: 'Submit prompt to AI Assistant' },
    { key: 'Escape', action: 'Close Modal', desc: 'Dismiss active dialog or overlay' }
  ];

  return (
    <div 
      onClick={() => setIsShortcutsHelpOpen(false)}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              Keyboard Shortcuts
            </h3>
          </div>
          <button 
            onClick={() => setIsShortcutsHelpOpen(false)} 
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((sc, i) => (
            <div 
              key={i}
              className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800/80 text-xs"
            >
              <div>
                <div className="font-semibold text-neutral-900 dark:text-white">{sc.action}</div>
                <div className="text-[11px] text-neutral-500">{sc.desc}</div>
              </div>
              <kbd className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-300 shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setIsShortcutsHelpOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
