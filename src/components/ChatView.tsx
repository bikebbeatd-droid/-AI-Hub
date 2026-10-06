import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Square, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Hash, 
  Sliders, 
  Flame,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Paperclip,
  Image as ImageIcon,
  FileText,
  FileCode,
  File as FileGeneric,
  X,
  Edit2,
  Trash2,
  Brain,
  UploadCloud,
  FileCheck,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Rocket,
  Lightbulb,
  Download,
  Layers,
  Cpu,
  Globe,
  Pin,
  Archive,
  Share2
} from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { ChatMessage, ChatAttachment } from '../types/index.ts';

const EMOJI_REACTIONS = [
  { emoji: '👍', icon: <ThumbsUp className="w-3.5 h-3.5" /> },
  { emoji: '👎', icon: <ThumbsDown className="w-3.5 h-3.5" /> },
  { emoji: '❤️', icon: <Heart className="w-3.5 h-3.5 text-rose-500" /> },
  { emoji: '🚀', icon: <Rocket className="w-3.5 h-3.5 text-amber-500" /> },
  { emoji: '💡', icon: <Lightbulb className="w-3.5 h-3.5 text-yellow-500" /> }
];

export const ChatView: React.FC = () => {
  const {
    activeConversation,
    sendMessage,
    editAndResendMessage,
    deleteMessage,
    toggleMessageReaction,
    exportConversation,
    isStreaming,
    generationState,
    stopStreaming,
    regenerateMessage,
    currentMode,
    selectedModel,
    selectedModelId,
    selectModel,
    setIsModelSelectorOpen,
    setActiveTab,
    pendingAttachments,
    addPendingAttachment,
    removePendingAttachment,
    clearPendingAttachments,
    uploadFile,
    composerRef,
    isEnsembleMode,
    setIsEnsembleMode,
    isWebSearchEnabled,
    setIsWebSearchEnabled,
    togglePinConversation,
    toggleArchiveConversation,
    duplicateConversation,
    shareConversation,
    settings
  } = useHub();

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);
  const [expandedThinkingId, setExpandedThinkingId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showToolsPicker, setShowToolsPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll on new tokens
  const scrollToBottom = () => {
    if (settings.general.autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, isStreaming, generationState]);

  // Auto-resize textarea
  useEffect(() => {
    if (composerRef.current) {
      composerRef.current.style.height = 'auto';
      composerRef.current.style.height = `${Math.min(composerRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if ((!input.trim() && pendingAttachments.length === 0) || isStreaming) return;
    sendMessage(input);
    setInput('');
    if (composerRef.current) {
      composerRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (settings.general.sendOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleDetails = (id: string) => {
    setExpandedDetailsId(prev => (prev === id ? null : id));
  };

  const toggleThinking = (id: string) => {
    setExpandedThinkingId(prev => (prev === id ? null : id));
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingAttachment(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const uploaded = await uploadFile(files[i]);
        addPendingAttachment({
          id: uploaded.id,
          name: uploaded.name,
          size: uploaded.size,
          type: uploaded.type,
          url: uploaded.url,
          previewUrl: uploaded.previewUrl,
          textContent: uploaded.textContent
        });
      }
    } catch (err: any) {
      alert(`File upload failed: ${err.message}`);
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    setIsUploadingAttachment(true);
    try {
      for (let i = 0; i < droppedFiles.length; i++) {
        const uploaded = await uploadFile(droppedFiles[i]);
        addPendingAttachment({
          id: uploaded.id,
          name: uploaded.name,
          size: uploaded.size,
          type: uploaded.type,
          url: uploaded.url,
          previewUrl: uploaded.previewUrl,
          textContent: uploaded.textContent
        });
      }
    } catch (err: any) {
      alert(`File attach failed: ${err.message}`);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setEditInput(msg.content);
  };

  const handleSaveEdit = (msgId: string) => {
    if (!editInput.trim()) return;
    editAndResendMessage(msgId, editInput.trim());
    setEditingMsgId(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getAttachmentIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />;
    if (type.includes('pdf')) return <FileText className="w-3.5 h-3.5 text-rose-500" />;
    if (type.includes('text') || type.includes('json') || type.includes('code')) return <FileCode className="w-3.5 h-3.5 text-emerald-500" />;
    return <FileGeneric className="w-3.5 h-3.5 text-neutral-400" />;
  };

  const messages = activeConversation?.messages || [];

  // Suggestion starter prompts
  const starterPrompts = [
    { title: 'Explain Logic & Proof', prompt: 'Explain the P versus NP problem step-by-step with clear logic, why it remains unsolved, and implications for cryptography.' },
    { title: 'Code Architecture', prompt: 'Write a robust TypeScript event-bus with strict event typing, wildcard subscriptions, and error handling.' },
    { title: 'Analyze & Summarize', prompt: 'What are the architectural differences between Transformer models, Mixture of Experts (MoE), and State Space Models (Mamba)?' },
    { title: 'Test GLM Foundation Model', prompt: 'Introduce yourself, your architecture, and summarize the key strengths of GLM-4 and GLM-5 models.' }
  ];

  const getGenerationStateLabel = () => {
    switch (generationState) {
      case 'thinking':
        return 'Analyzing intent & thinking...';
      case 'reading_image':
        return 'Reading & processing image attachment...';
      case 'analyzing_file':
        return 'Extracting file contents & analyzing document...';
      case 'generating_image':
        return 'Synthesizing visual asset...';
      case 'generating':
        return isEnsembleMode ? 'Streaming multi-model responses simultaneously...' : 'Streaming AI response...';
      default:
        return 'Processing request...';
    }
  };

  return (
    <div 
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={e => { e.preventDefault(); setIsDragOver(false); }}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col h-full bg-white dark:bg-neutral-950 overflow-hidden relative ${
        isDragOver ? 'ring-4 ring-blue-500/40 ring-inset bg-blue-50/20 dark:bg-blue-950/20' : ''
      }`}
    >
      {/* Hidden File Picker Input */}
      <input 
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileAttach}
        className="hidden"
      />

      {/* Main Chat Top Bar */}
      <div className="px-3 sm:px-6 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 backdrop-blur-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Model Selector Dropdown Trigger */}
          <button
            onClick={() => setIsModelSelectorOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 transition-all text-xs md:text-sm font-bold text-neutral-900 dark:text-white shadow-xs cursor-pointer group"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>
              {selectedModel ? selectedModel.displayName : (currentMode === 'AUTO' ? 'Auto' : currentMode)}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200" />
          </button>

          {/* Multi-Model Ensemble Toggle */}
          <button
            onClick={() => setIsEnsembleMode(!isEnsembleMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isEnsembleMode 
                ? 'bg-purple-600 text-white border-purple-500 shadow-xs ring-2 ring-purple-500/20' 
                : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
            }`}
            title="Parallel Consensus: Query Gemini, GLM, and NVIDIA NIM models simultaneously"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Multi-Model Consensus</span>
            <span className="text-[10px] uppercase font-mono px-1 rounded bg-black/20 text-white">
              {isEnsembleMode ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Right Utility: Pin, Duplicate, Share & Export */}
        <div className="flex items-center gap-1.5 relative">
          {activeConversation && (
            <>
              <button
                onClick={() => togglePinConversation(activeConversation.id)}
                className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  activeConversation.isPinned
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-600'
                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title={activeConversation.isPinned ? 'Unpin Chat' : 'Pin Chat'}
              >
                <Pin className="w-3.5 h-3.5 fill-current" />
              </button>

              <button
                onClick={() => duplicateConversation(activeConversation.id)}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-xs cursor-pointer"
                title="Duplicate Conversation"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  const url = shareConversation(activeConversation.id);
                  navigator.clipboard.writeText(url);
                  alert(`Share link copied: ${url}`);
                }}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-xs cursor-pointer"
                title="Share Conversation"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer shadow-xs"
            title="Export conversation history"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {showExportMenu && activeConversation && (
            <div 
              onClick={() => setShowExportMenu(false)}
              className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-1 z-30 text-xs space-y-0.5"
            >
              <button
                onClick={() => exportConversation(activeConversation.id, 'json')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer"
              >
                Export as JSON (.json)
              </button>
              <button
                onClick={() => exportConversation(activeConversation.id, 'md')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer"
              >
                Export as Markdown (.md)
              </button>
              <button
                onClick={() => exportConversation(activeConversation.id, 'text')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer"
              >
                Export as Plain Text (.txt)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-12 py-4 space-y-6">
        {messages.length === 0 ? (
          /* Modern AI Assistant Landing State */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-8 sm:py-12 px-3 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs ring-1 ring-blue-500/20">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                How can AI Hub help you today?
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
                Ask anything, analyze documents, generate images &amp; videos, write code, or research topics with instant multi-model routing.
              </p>
            </div>

            {/* Quick Action Tools Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
              <button
                onClick={() => { setInput('Create a photorealistic image of '); composerRef.current?.focus(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700/80"
              >
                <ImageIcon className="w-3.5 h-3.5 text-pink-500" />
                <span>Create Image</span>
              </button>

              <button
                onClick={() => { setInput('Create a 60-second video of '); composerRef.current?.focus(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700/80"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Create Video</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700/80"
              >
                <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                <span>Analyze File</span>
              </button>

              <button
                onClick={() => { setInput('Write a clean TypeScript solution for '); composerRef.current?.focus(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700/80"
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-500" />
                <span>Write Code</span>
              </button>

              <button
                onClick={() => { setIsWebSearchEnabled(true); setInput('Research key insights and recent developments regarding '); composerRef.current?.focus(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700/80"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>Research</span>
              </button>

              <button
                onClick={() => { setInput('Create a comprehensive structured report on '); composerRef.current?.focus(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700/80"
              >
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>Create Document</span>
              </button>
            </div>

            {/* Prompt Starter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-2">
              {starterPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(item.prompt)}
                  className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all text-left shadow-2xs group cursor-pointer"
                >
                  <div className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center justify-between">
                    <span>{item.title}</span>
                    <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => {
            const isUser = msg.role === 'user';
            const isError = msg.isError;
            const isEditing = editingMsgId === msg.id;

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-4xl ${isUser ? 'ml-auto' : 'mr-auto'} w-full group`}
              >
                {/* Message Meta Header */}
                <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-neutral-400">
                  <span className="font-medium text-neutral-600 dark:text-neutral-300">
                    {isUser ? 'You' : (msg.modelDisplayName || 'AI Assistant')}
                  </span>
                  {!isUser && msg.provider && (
                    <span className="font-mono uppercase text-[9px] px-1 rounded bg-neutral-100 dark:bg-neutral-800">
                      {msg.provider}
                    </span>
                  )}
                  {msg.latencyMs !== undefined && (
                    <span className="flex items-center gap-0.5 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {msg.latencyMs}ms
                    </span>
                  )}
                </div>

                {/* Message Bubble Container */}
                <div
                  className={`w-full rounded-2xl p-4 text-sm transition-all shadow-xs ${
                    isUser
                      ? 'bg-blue-600 text-white dark:bg-blue-600 rounded-br-xs max-w-2xl'
                      : isError
                      ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-neutral-900 dark:text-neutral-100'
                      : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-bl-xs text-neutral-900 dark:text-neutral-100'
                  }`}
                >
                  {/* Attached Files display on user message */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {msg.attachments.map(att => (
                        <div 
                          key={att.id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg text-xs ${
                            isUser 
                              ? 'bg-blue-700/60 text-white border border-blue-400/30' 
                              : 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white'
                          }`}
                        >
                          {att.previewUrl ? (
                            <img src={att.previewUrl} alt={att.name} className="w-7 h-7 rounded object-cover" />
                          ) : (
                            getAttachmentIcon(att.type)
                          )}
                          <div className="truncate max-w-[140px]">
                            <div className="truncate font-medium text-[11px]">{att.name}</div>
                            <div className="text-[10px] opacity-75">{formatFileSize(att.size)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ensemble / Multi-Model Side-by-Side Comparison */}
                  {!isUser && msg.ensembleResponses && msg.ensembleResponses.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                        <Layers className="w-4 h-4" />
                        <span>Multi-Model Consensus Comparison ({msg.ensembleResponses.length} Models)</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {msg.ensembleResponses.map((ens, idx) => (
                          <div 
                            key={idx}
                            className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between space-y-2"
                          >
                            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                              <span className="truncate">{ens.modelDisplayName}</span>
                              <span className="text-[10px] font-mono text-neutral-400 uppercase">{ens.provider}</span>
                            </div>

                            <div className="text-xs leading-relaxed min-h-[100px]">
                              {ens.error ? (
                                <span className="text-red-500 font-semibold">{ens.error}</span>
                              ) : ens.content ? (
                                <MarkdownRenderer content={ens.content} />
                              ) : (
                                <span className="text-neutral-400 italic flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  Streaming response...
                                </span>
                              )}
                            </div>

                            {ens.latencyMs && (
                              <div className="text-[10px] font-mono text-neutral-400 border-t border-neutral-100 dark:border-neutral-900 pt-1">
                                Latency: {ens.latencyMs}ms
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* AI Optimization & Synthesis Action */}
                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-neutral-500">
                          Multi-AI Collaboration Active
                        </span>
                        <button
                          onClick={() => {
                            const combinedOutputs = msg.ensembleResponses
                              ?.map(e => `[Model: ${e.modelDisplayName} (${e.provider})]\n${e.content}`)
                              .join('\n\n---\n\n');
                            const prompt = `Synthesize and optimize the outputs from the AI models above into one unified, definitive best response that resolves discrepancies and combines their strengths:\n\n${combinedOutputs}`;
                            sendMessage(prompt);
                          }}
                          disabled={isStreaming || msg.ensembleResponses.some(e => e.isStreaming)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Synthesize &amp; Optimize Consensus Output</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Standard Single Model Response */
                    <>
                      {/* Thinking / Reasoning Indicator */}
                      {!isUser && (msg.isThinking || msg.reasoningContent) && (
                        <div className="mb-3">
                          <button
                            onClick={() => toggleThinking(msg.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                          >
                            <Brain className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                            <span>Thinking Process</span>
                            {expandedThinkingId === msg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {expandedThinkingId === msg.id && (
                            <div className="mt-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 font-mono text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                              {msg.reasoningContent || 'Decomposing task, analyzing parameters, and formulating structured solution...'}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content Area */}
                      {isUser ? (
                        isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              value={editInput}
                              onChange={e => setEditInput(e.target.value)}
                              className="w-full p-2 text-xs rounded bg-white text-neutral-900 outline-none border border-neutral-300 font-mono"
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingMsgId(null)}
                                className="px-2 py-1 text-xs text-white hover:underline cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(msg.id)}
                                className="px-3 py-1 text-xs bg-white text-blue-600 font-semibold rounded cursor-pointer"
                              >
                                Save &amp; Resend
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap leading-relaxed select-text font-normal">
                            {msg.content}
                          </div>
                        )
                      ) : isError ? (
                        /* Error Presentation */
                        <div className="space-y-3">
                          <div className="flex items-start gap-2.5 text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-xs sm:text-sm">
                                {msg.errorDetails?.message || 'Inference Generation Error'}
                              </div>
                              {msg.errorDetails?.suggestion && (
                                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                                  {msg.errorDetails.suggestion}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Expandable Technical Details */}
                          {msg.errorDetails?.technicalDetails && (
                            <div>
                              <button
                                onClick={() => toggleDetails(msg.id)}
                                className="flex items-center gap-1 text-[11px] font-mono text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
                              >
                                <span>Technical Diagnostic Details</span>
                                {expandedDetailsId === msg.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              {expandedDetailsId === msg.id && (
                                <pre className="mt-2 p-2.5 rounded bg-neutral-900 text-neutral-200 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap max-h-48">
                                  {msg.errorDetails.technicalDetails}
                                </pre>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => setActiveTab('settings')}
                              className="px-2.5 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer"
                            >
                              Configure API Keys
                            </button>

                            <button
                              onClick={() => regenerateMessage(msg.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Markdown Body */
                        <div>
                          {msg.fallbackUsed && (
                            <div className="mb-2 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                Auto fallback activated: Switched from <strong className="font-mono">{msg.fallbackUsed.originalModelId}</strong> ({msg.fallbackUsed.reason}).
                              </span>
                            </div>
                          )}

                          <MarkdownRenderer content={msg.content} />

                          {msg.isStreaming && (
                            <span className="inline-block w-2 h-4 ml-1 bg-blue-600 animate-pulse align-middle" />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer Reactions & Action Toolbar */}
                <div className="flex flex-wrap items-center gap-2 mt-1 px-1 text-neutral-400">
                  {/* Emoji Reactions Bar */}
                  <div className="flex items-center gap-0.5 bg-neutral-100/80 dark:bg-neutral-800/60 rounded-full px-1.5 py-0.5 border border-neutral-200/60 dark:border-neutral-700/60">
                    {EMOJI_REACTIONS.map(r => {
                      const isActive = Boolean(msg.reactions?.[r.emoji]);
                      return (
                        <button
                          key={r.emoji}
                          onClick={() => toggleMessageReaction(msg.id, r.emoji)}
                          className={`p-1 rounded-full text-xs transition-colors cursor-pointer ${
                            isActive ? 'bg-blue-100 dark:bg-blue-900/80 text-blue-600 dark:text-blue-300 font-bold scale-110' : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 opacity-70 hover:opacity-100'
                          }`}
                          title={`React with ${r.emoji}`}
                        >
                          {r.icon}
                        </button>
                      );
                    })}
                  </div>

                  {isUser ? (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="p-1 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleStartEdit(msg)}
                        className="p-1 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors"
                        title="Edit and resend"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="p-1 hover:text-red-600 rounded transition-colors"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : !isError && msg.content ? (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="p-1 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => regenerateMessage(msg.id)}
                        className="p-1 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors"
                        title="Regenerate response"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bottom Bar */}
      <div className="p-3 sm:p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Active Generation State Banner */}
          {isStreaming && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="font-medium">{getGenerationStateLabel()}</span>
              </div>
              <button
                onClick={stopStreaming}
                className="text-xs font-semibold hover:underline flex items-center gap-1 text-red-600 dark:text-red-400 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          )}

          {/* Pending Attachments Pills */}
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              {pendingAttachments.map(att => (
                <div 
                  key={att.id}
                  className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white shadow-2xs"
                >
                  {att.previewUrl ? (
                    <img src={att.previewUrl} alt={att.name} className="w-4 h-4 rounded object-cover" />
                  ) : (
                    getAttachmentIcon(att.type)
                  )}
                  <span className="truncate max-w-[120px] font-medium text-[11px]">{att.name}</span>
                  <span className="text-[10px] text-neutral-400">({formatFileSize(att.size)})</span>
                  <button
                    onClick={() => removePendingAttachment(att.id)}
                    className="p-1 hover:text-red-600 rounded"
                    title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={clearPendingAttachments}
                className="text-[11px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 self-center px-2 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Input Box */}
          <div className="relative flex items-end gap-1.5 sm:gap-2 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-1.5 sm:p-2 focus-within:border-blue-500 transition-colors shadow-xs">
            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || isUploadingAttachment}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Attach files (Images, PDFs, Documents, Code)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Assistant Tools Picker Button & Popover */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowToolsPicker(!showToolsPicker)}
                disabled={isStreaming}
                className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1 text-xs font-semibold ${
                  showToolsPicker 
                    ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white' 
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
                title="Assistant Tools"
              >
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="text-[11px] font-medium hidden xs:inline sm:inline">Tools</span>
              </button>

              {/* Tools Popover Menu */}
              {showToolsPicker && (
                <div 
                  onClick={() => setShowToolsPicker(false)}
                  className="absolute bottom-12 left-0 z-50 w-60 p-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-1 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150"
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    AI Assistant Tools
                  </div>

                  <button
                    onClick={() => { setInput('Create a photorealistic image of '); composerRef.current?.focus(); setShowToolsPicker(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-pink-500 shrink-0" />
                    <span>AI Image Generator</span>
                  </button>

                  <button
                    onClick={() => { setInput('Create a 60-second video of '); composerRef.current?.focus(); setShowToolsPicker(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>AI Video Generator</span>
                  </button>

                  <button
                    onClick={() => { fileInputRef.current?.click(); setShowToolsPicker(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Analyze PDF / File</span>
                  </button>

                  <button
                    onClick={() => { setInput('Write a clean TypeScript solution for '); composerRef.current?.focus(); setShowToolsPicker(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span>Code Architecture</span>
                  </button>

                  <button
                    onClick={() => { setIsWebSearchEnabled(true); setShowToolsPicker(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Live Web Search</span>
                  </button>
                </div>
              )}
            </div>

            {/* Web Search Toggle Button */}
            <button
              onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
              disabled={isStreaming}
              className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1 text-xs font-semibold ${
                isWebSearchEnabled 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
              title="Toggle Live Web Search"
            >
              <Globe className="w-4 h-4" />
              {isWebSearchEnabled && <span className="text-[10px] hidden sm:inline">Search ON</span>}
            </button>

            <textarea
              ref={composerRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isStreaming 
                  ? 'AI is generating response...' 
                  : pendingAttachments.length > 0 
                  ? 'Add your question or instruction about the attached files...' 
                  : isEnsembleMode
                  ? 'Ask all AI models simultaneously in Multi-Model Consensus mode...'
                  : 'Ask anything, analyze documents, write code, or prompt AI...'
              }
              disabled={isStreaming}
              rows={1}
              className="flex-1 bg-transparent border-0 resize-none py-1.5 px-2 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none max-h-44 disabled:opacity-60"
            />

            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shrink-0 cursor-pointer transition-colors shadow-xs flex items-center justify-center"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() && pendingAttachments.length === 0}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 disabled:text-neutral-400 text-white shrink-0 cursor-pointer transition-colors shadow-xs flex items-center justify-center disabled:cursor-not-allowed"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Helper Tip */}
          <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400">
            <span>Drag &amp; drop files anywhere to attach</span>
            <span className="hidden sm:inline">⌘+I to focus composer · ⌘+N new chat · ⌘+/ shortcuts</span>
          </div>
        </div>
      </div>
    </div>
  );
};
