import React, { useState } from 'react';
import { 
  Bot, 
  Plus, 
  Trash2, 
  Sparkles, 
  MessageSquare, 
  X, 
  Check, 
  Search,
  Code,
  Brain,
  FileText,
  Palette
} from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';

export const AssistantsView: React.FC = () => {
  const { assistants, createAssistant, deleteAssistant, createNewChat, sendMessage } = useHub();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Assistant Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [category, setCategory] = useState('Coding');

  const categories = ['All', 'Coding', 'Research', 'Analysis', 'Writing', 'Productivity'];

  const filteredAssistants = assistants.filter(a => {
    const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                          a.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemInstruction.trim()) return;

    createAssistant({
      name: name.trim(),
      description: description.trim() || 'Custom AI Assistant persona',
      avatar,
      systemInstruction: systemInstruction.trim(),
      category
    });

    setIsModalOpen(false);
    setName('');
    setDescription('');
    setSystemInstruction('');
  };

  const handleStartChat = (assistantSystemInstruction: string) => {
    createNewChat('AUTO');
    sendMessage(`[System Prompt Set]: ${assistantSystemInstruction}\n\nHello! How can you assist me today?`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 backdrop-blur-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-500" />
            <span>Custom AI Assistants</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Configure specialized personas with custom system prompts, avatars, and behavioral guardrails.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Assistant</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assistants..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid of Assistants */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {filteredAssistants.map(asst => (
            <div 
              key={asst.id}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-500/50 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-xl shadow-2xs">
                    {asst.avatar || '🤖'}
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold">
                    {asst.category}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {asst.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                    {asst.description}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 font-mono text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2 border border-neutral-100 dark:border-neutral-800/80">
                  {asst.systemInstruction}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 mt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => deleteAssistant(asst.id)}
                  className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Delete Assistant"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleStartChat(asst.systemInstruction)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Start Chat</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Assistant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h2 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-500" />
                <span>Create Custom Assistant</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Avatar</label>
                  <input 
                    type="text" 
                    value={avatar} 
                    onChange={e => setAvatar(e.target.value)}
                    className="w-full p-2 text-center text-lg rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Assistant Name</label>
                  <input 
                    type="text" 
                    required
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Legal Contract Reviewer"
                    className="w-full p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Category</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  className="w-full p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white"
                >
                  <option value="Coding">Coding</option>
                  <option value="Research">Research</option>
                  <option value="Analysis">Analysis</option>
                  <option value="Writing">Writing</option>
                  <option value="Productivity">Productivity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Short summary of what this assistant does..."
                  className="w-full p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">System Instruction / Prompt Guardrails</label>
                <textarea 
                  rows={4}
                  required
                  value={systemInstruction} 
                  onChange={e => setSystemInstruction(e.target.value)}
                  placeholder="You are an expert in... Always answer with..."
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono text-xs text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Create Persona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
