import React, { useState } from 'react';
import { 
  Folder, 
  Plus, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  MessageSquare, 
  FileText, 
  ArrowRight,
  Shield,
  Layers
} from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';
import { ProjectItem } from '../types/index.ts';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    createProject,
    updateProject,
    deleteProject,
    createNewChat,
    models
  } = useHub();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInstruction, setNewInstruction] = useState('');
  const [newModel, setNewModel] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editInstruction, setEditInstruction] = useState('');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createProject({
      title: newTitle.trim(),
      description: newDesc.trim(),
      systemInstruction: newInstruction.trim(),
      defaultModelId: newModel || undefined
    });
    setNewTitle('');
    setNewDesc('');
    setNewInstruction('');
    setIsCreating(false);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    await updateProject(id, {
      title: editTitle.trim(),
      systemInstruction: editInstruction.trim()
    });
    setEditingId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" />
            <span>Projects &amp; Workspaces</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Organize chats and context with custom system personas, specialized files, and target models.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs sm:text-sm transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Create Modal / Card */}
        {isCreating && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-blue-500/40 p-5 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-blue-500" />
                <span>Create New Project Workspace</span>
              </h3>
              <button onClick={() => setIsCreating(false)} className="text-neutral-400 hover:text-neutral-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Project Title *
                </label>
                <input 
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Mobile App Redesign, Market Research Q3, Python API Backend"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm text-neutral-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <input 
                  type="text"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Briefly describe the purpose of this project..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm text-neutral-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Custom System Persona &amp; Instructions
                </label>
                <textarea 
                  rows={3}
                  value={newInstruction}
                  onChange={e => setNewInstruction(e.target.value)}
                  placeholder="Define specific instructions for how the AI should behave in this workspace (e.g. You are a Senior React Architect. Always use TypeScript and Tailwind CSS)..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm text-neutral-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-50 cursor-pointer"
              >
                Create Workspace
              </button>
            </div>
          </div>
        )}

        {/* Project List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => {
            const isActive = activeProjectId === project.id;
            const isEditing = editingId === project.id;

            return (
              <div
                key={project.id}
                className={`bg-white dark:bg-neutral-900 rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                  isActive 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                        <Folder className="w-4 h-4" />
                      </div>
                      <div>
                        {isEditing ? (
                          <input 
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="px-2 py-0.5 rounded border border-blue-500 bg-white dark:bg-neutral-950 text-xs font-bold text-neutral-900 dark:text-white"
                          />
                        ) : (
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                            {project.title}
                          </h3>
                        )}
                        <span className="text-[11px] text-neutral-400">
                          Updated {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEdit(project.id)} className="p-1 text-emerald-600">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-neutral-400">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(project.id);
                              setEditTitle(project.title);
                              setEditInstruction(project.systemInstruction || '');
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {project.id !== 'proj_default' && (
                            <button
                              onClick={() => deleteProject(project.id)}
                              className="p-1 text-neutral-400 hover:text-red-600 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                      {project.description}
                    </p>
                  )}

                  {isEditing ? (
                    <textarea 
                      rows={2}
                      value={editInstruction}
                      onChange={e => setEditInstruction(e.target.value)}
                      placeholder="System instructions..."
                      className="w-full p-2 text-xs rounded border border-blue-500 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white mb-3"
                    />
                  ) : project.systemInstruction && (
                    <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 mb-3 font-mono line-clamp-2">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-300">Prompt: </span>
                      {project.systemInstruction}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setActiveProjectId(isActive ? null : project.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' 
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {isActive ? '✓ Active Workspace' : 'Set as Active'}
                  </button>

                  <button
                    onClick={() => createNewChat('AUTO', undefined, project.id)}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>New Chat Here</span>
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
