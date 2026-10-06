import React, { useState } from 'react';
import { History, Search, Trash2, MessageSquare, Clock, Download, ChevronRight } from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';

export const HistoryView: React.FC = () => {
  const { conversations, selectConversation, deleteConversation, clearAllConversations } = useHub();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.messages.some(m => m.content.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            <span>Conversation History</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Full searchable log of all past AI interactions and multi-turn sessions.
          </p>
        </div>

        {conversations.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Clear all conversation history?')) clearAllConversations();
            }}
            className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 text-xs font-semibold hover:bg-red-100 cursor-pointer"
          >
            Clear All History
          </button>
        )}
      </div>

      <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white/40 dark:bg-neutral-900/40">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transcript text or topic..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm text-neutral-900 dark:text-white outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">
            No matching conversation history found.
          </div>
        ) : (
          filtered.map(conv => (
            <div 
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className="group p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 transition-all cursor-pointer shadow-xs flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                    {conv.title || 'Untitled Conversation'}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(conv.updatedAt).toLocaleString()}
                    </span>
                    <span>• {conv.messages.length} messages</span>
                    <span className="font-mono uppercase text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {conv.mode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="p-2 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
