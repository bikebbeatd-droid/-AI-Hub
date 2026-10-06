import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  HardDrive,
  Sparkles,
  Layers,
  History, 
  Settings, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  Database,
  Star,
  ExternalLink
} from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setIsSidebarOpen,
    conversations,
    activeConversationId,
    createNewChat,
    selectConversation,
    deleteConversation,
    renameConversation,
    files,
    projects,
    syncStatus,
    providerStatus
  } = useHub();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-[min(85vw,320px)] md:w-64 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-transform duration-200 ease-in-out shadow-2xl md:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Action: New Chat */}
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => { createNewChat(); setIsSidebarOpen(false); }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="p-2 space-y-0.5 border-b border-neutral-200 dark:border-neutral-800">
          {/* Chat */}
          <button
            onClick={() => { setActiveTab('chat'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'chat' 
                ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span>Chat</span>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-neutral-400">
              {conversations.length}
            </span>
          </button>

          {/* Assistants */}
          <button
            onClick={() => { setActiveTab('assistants'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'assistants' 
                ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Assistants</span>
            </div>
          </button>

          {/* Prompts Library */}
          <button
            onClick={() => { setActiveTab('prompts'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'prompts' 
                ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-amber-500" />
              <span>Prompts</span>
            </div>
          </button>

          {/* Artifacts Workspace */}
          <button
            onClick={() => { setActiveTab('artifacts'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'artifacts' 
                ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-cyan-500" />
              <span>Artifacts</span>
            </div>
          </button>

          {/* Files */}
          <button
            onClick={() => { setActiveTab('files'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'files' 
                ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-emerald-500" />
              <span>Files</span>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-neutral-400">
              {files.length}
            </span>
          </button>

          {/* AI Tools */}
          <button
            onClick={() => { setActiveTab('tools'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'tools' 
                ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>AI Tools</span>
            </div>
          </button>

          {/* Projects */}
          <button
            onClick={() => { setActiveTab('projects'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'projects' 
                ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Projects</span>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-neutral-400">
              {projects.length}
            </span>
          </button>

          {/* Models */}
          <button
            onClick={() => { setActiveTab('models'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'models' 
                ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-purple-500" />
              <span>Models Hub</span>
            </div>
          </button>

          {/* Settings */}
          <button
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 text-neutral-500" />
              <span>Settings</span>
            </div>
          </button>
        </div>

        {/* Conversation History Scroll Area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 tracking-wide uppercase flex items-center justify-between">
            <span>Recent Chats</span>
            <span className="text-[10px] font-mono">{conversations.length}</span>
          </div>

          {conversations.length === 0 ? (
            <div className="p-3 text-xs text-neutral-400 text-center">
              No conversations yet
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = activeTab === 'chat' && conv.id === activeConversationId;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`group relative flex items-center justify-between px-2.5 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="flex-1 bg-white dark:bg-neutral-950 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-neutral-900 dark:text-white outline-none"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveRename(conv.id, e as any);
                          if (e.key === 'Escape') handleCancelRename(e as any);
                        }}
                      />
                      <button 
                        onClick={e => handleSaveRename(conv.id, e)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-neutral-700 rounded"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={handleCancelRename}
                        className="p-1 text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60 text-blue-500" />
                        <span className="truncate">{conv.title || 'Untitled'}</span>
                      </div>

                      {/* Hover action buttons */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={e => handleStartRename(conv.id, conv.title, e)}
                          className="p-1 hover:text-neutral-900 dark:hover:text-white rounded"
                          title="Rename"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => handleDelete(conv.id, e)}
                          className="p-1 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Live Providers Telemetry Status */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-950/40 text-[11px] space-y-2">
          <div className="flex items-center justify-between text-neutral-500 font-medium">
            <span>Provider Gateway</span>
            <span className="font-mono tabular-nums text-[10px]">
              {syncStatus.totalModels} models
            </span>
          </div>

          <div className="space-y-1 font-mono text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">OpenRouter</span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${providerStatus.openrouter.connected ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                <span className="text-neutral-500">
                  {providerStatus.openrouter.connected ? 'Active' : 'Ready'}
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">NVIDIA NIM</span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${providerStatus.nvidia.connected ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                <span className="text-neutral-500">
                  {providerStatus.nvidia.connected ? 'Active' : 'Ready'}
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Google Gemini</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-neutral-500">Active</span>
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
