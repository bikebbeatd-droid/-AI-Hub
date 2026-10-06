import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  ModelInfo, 
  ModelMode, 
  ProviderType, 
  Conversation, 
  ChatMessage, 
  SyncStatus, 
  ProviderStatusMap, 
  ChatMessageErrorDetails,
  NavigationTab,
  GenerationState,
  ChatAttachment,
  FileItem,
  ProjectItem,
  AppSettings,
  EnsembleComparison,
  CustomAssistant,
  MemoryItem,
  PromptTemplate,
  ArtifactItem,
  SearchCitation
} from '../types/index.ts';
import * as api from '../services/api.ts';

interface ProviderKeys {
  openrouter: string;
  nvidia: string;
  gemini: string;
}

interface HubContextType {
  // Navigation & View
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isModelSelectorOpen: boolean;
  setIsModelSelectorOpen: (open: boolean) => void;
  isShortcutsHelpOpen: boolean;
  setIsShortcutsHelpOpen: (open: boolean | ((prev: boolean) => boolean)) => void;

  // Models & Sync
  models: ModelInfo[];
  syncStatus: SyncStatus;
  refreshModels: () => Promise<void>;
  currentMode: ModelMode;
  setMode: (mode: ModelMode) => void;
  selectedModelId: string | null;
  selectedModelIds: string[]; // Simultaneous multi-model selection
  toggleSelectedModelId: (modelId: string) => void;
  clearSelectedModelIds: () => void;
  selectedModel: ModelInfo | null;
  selectModel: (modelId: string | null, mode?: ModelMode) => void;
  testingModel: ModelInfo | null;
  setTestingModel: (model: ModelInfo | null) => void;

  // Web Search
  isWebSearchEnabled: boolean;
  setIsWebSearchEnabled: (enabled: boolean) => void;

  // Multi-Model Ensemble Consensus
  isEnsembleMode: boolean;
  setIsEnsembleMode: (active: boolean) => void;
  sendEnsembleMessage: (content: string, customModelIds?: string[]) => Promise<void>;

  // Providers & Keys
  providerKeys: ProviderKeys;
  setProviderKey: (provider: ProviderType, key: string) => void;
  providerStatus: ProviderStatusMap;
  testProvider: (provider: ProviderType) => Promise<{ success: boolean; latencyMs: number; error?: string }>;

  // Conversations & Chat
  conversations: Conversation[];
  activeConversationId: string;
  activeConversation: Conversation | null;
  createNewChat: (mode?: ModelMode, modelId?: string, projectId?: string, assistantId?: string) => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  togglePinConversation: (id: string) => void;
  toggleArchiveConversation: (id: string) => void;
  duplicateConversation: (id: string) => void;
  shareConversation: (id: string) => string;
  clearAllConversations: () => void;
  sendMessage: (content: string, attachments?: ChatAttachment[]) => Promise<void>;
  editAndResendMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => void;
  toggleMessageReaction: (messageId: string, emoji: string) => void;
  exportConversation: (convId: string, format: 'json' | 'text' | 'md') => void;
  stopStreaming: () => void;
  regenerateMessage: (messageId: string) => Promise<void>;
  isStreaming: boolean;
  generationState: GenerationState;
  streamError: ChatMessageErrorDetails | null;

  // Composer Ref for focus shortcut
  composerRef: React.RefObject<HTMLTextAreaElement | null>;

  // Pending Attachments in Chat Composer
  pendingAttachments: ChatAttachment[];
  addPendingAttachment: (att: ChatAttachment) => void;
  removePendingAttachment: (attId: string) => void;
  clearPendingAttachments: () => void;
  attachFileToCurrentChat: (file: FileItem) => void;

  // File System Workspace
  files: FileItem[];
  isLoadingFiles: boolean;
  refreshFiles: () => Promise<void>;
  uploadFile: (file: File, projectId?: string) => Promise<FileItem>;
  deleteFile: (id: string) => Promise<void>;
  renameFile: (id: string, newName: string) => Promise<void>;
  analyzeFile: (id: string) => Promise<string>;

  // Project Workspaces
  projects: ProjectItem[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  createProject: (data: { title: string; description?: string; systemInstruction?: string; defaultModelId?: string }) => Promise<ProjectItem>;
  updateProject: (id: string, updates: Partial<ProjectItem>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Custom Assistants
  assistants: CustomAssistant[];
  createAssistant: (data: Omit<CustomAssistant, 'id' | 'createdAt'>) => CustomAssistant;
  deleteAssistant: (id: string) => void;

  // Prompt Library
  prompts: PromptTemplate[];
  savePrompt: (data: Omit<PromptTemplate, 'id'>) => PromptTemplate;
  deletePrompt: (id: string) => void;

  // AI Memory
  memories: MemoryItem[];
  addMemory: (text: string, category?: 'preference' | 'fact' | 'instruction') => void;
  deleteMemory: (id: string) => void;
  clearMemories: () => void;

  // Artifacts / Workspace
  artifacts: ArtifactItem[];
  activeArtifact: ArtifactItem | null;
  setActiveArtifact: (art: ArtifactItem | null) => void;
  saveArtifact: (art: Omit<ArtifactItem, 'id' | 'createdAt' | 'updatedAt'>) => ArtifactItem;

  // AI Tools & Generation
  generateImage: (prompt: string, aspectRatio?: string, style?: string) => Promise<FileItem>;
  isGeneratingImage: boolean;

  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Favorites & Theme
  favorites: string[];
  toggleFavorite: (modelId: string) => void;
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

const HubContext = createContext<HubContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  KEYS: 'ai_hub_provider_keys',
  CONVERSATIONS: 'ai_hub_conversations',
  ACTIVE_ID: 'ai_hub_active_conv_id',
  FAVORITES: 'ai_hub_favorites',
  THEME: 'ai_hub_theme',
  MODE: 'ai_hub_mode',
  MODEL_ID: 'ai_hub_selected_model_id',
  MULTI_MODEL_IDS: 'ai_hub_selected_model_ids',
  SETTINGS: 'ai_hub_settings',
  ACTIVE_PROJECT: 'ai_hub_active_project_id',
  ENSEMBLE_MODE: 'ai_hub_ensemble_mode',
  ASSISTANTS: 'ai_hub_assistants',
  PROMPTS: 'ai_hub_prompts',
  MEMORIES: 'ai_hub_memories',
  ARTIFACTS: 'ai_hub_artifacts'
};

const DEFAULT_SETTINGS: AppSettings = {
  general: {
    defaultMode: 'AUTO',
    autoScroll: true,
    sendOnEnter: true
  },
  appearance: {
    theme: 'dark',
    fontSize: 'medium',
    bubbleStyle: 'bordered'
  },
  ai: {
    defaultModelId: '',
    temperature: 0.7,
    maxOutputTokens: 4096,
    enableThinking: true,
    fallbackEnabled: true
  },
  files: {
    maxFileSizeMb: 50,
    autoSummarize: true
  },
  chat: {
    systemInstruction: '',
    streamSpeed: 'fast',
    renderMarkdownMath: true
  },
  privacy: {
    saveHistoryLocally: true
  }
};

export const HubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavigationTab>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [testingModel, setTestingModel] = useState<ModelInfo | null>(null);

  // Ensemble Mode State
  const [isEnsembleMode, setIsEnsembleModeState] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.ENSEMBLE_MODE) === 'true';
  });

  const setIsEnsembleMode = (active: boolean) => {
    setIsEnsembleModeState(active);
    localStorage.setItem(LOCAL_STORAGE_KEYS.ENSEMBLE_MODE, active ? 'true' : 'false');
  };

  // Composer Ref for Keyboard Shortcut
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Multi-Model Selection State
  const [selectedModelIds, setSelectedModelIdsState] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.MULTI_MODEL_IDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleSelectedModelId = (modelId: string) => {
    setSelectedModelIdsState(prev => {
      const next = prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId];
      localStorage.setItem(LOCAL_STORAGE_KEYS.MULTI_MODEL_IDS, JSON.stringify(next));
      return next;
    });
  };

  const clearSelectedModelIds = () => {
    setSelectedModelIdsState([]);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.MULTI_MODEL_IDS);
  };

  // Web Search Toggle State
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);

  // Custom Assistants State
  const DEFAULT_ASSISTANTS: CustomAssistant[] = [
    {
      id: 'asst_code_architect',
      name: 'Senior Architect & Code Auditor',
      description: 'Expert TypeScript, React, and backend system architect for code reviews, refactoring, and performance.',
      avatar: '💻',
      systemInstruction: 'You are a principal software architect. Provide clean, production-ready TypeScript code with strict safety, security best practices, and performance optimization.',
      category: 'Coding',
      createdAt: Date.now() - 86400000 * 5
    },
    {
      id: 'asst_deep_researcher',
      name: 'Deep Academic Researcher',
      description: 'Systematic literature synthesizer, factual claim verifier, and structured report writer.',
      avatar: '🔬',
      systemInstruction: 'You are an academic researcher. Analyze topics with logical rigor, structure findings into executive summaries, highlight uncertainties, and cite sources.',
      category: 'Research',
      createdAt: Date.now() - 86400000 * 4
    },
    {
      id: 'asst_data_analyst',
      name: 'Data Analyst & Grid Specialist',
      description: 'Transforms unstructured text, log files, and raw data into Markdown tables, CSVs, and JSON objects.',
      avatar: '📊',
      systemInstruction: 'You are a data analyst. Convert raw input into structured, well-aligned Markdown tables, valid JSON, or cleaned CSVs with headers and metrics.',
      category: 'Analysis',
      createdAt: Date.now() - 86400000 * 3
    }
  ];

  const [assistants, setAssistants] = useState<CustomAssistant[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ASSISTANTS);
      return saved ? JSON.parse(saved) : DEFAULT_ASSISTANTS;
    } catch {
      return DEFAULT_ASSISTANTS;
    }
  });

  const createAssistant = (data: Omit<CustomAssistant, 'id' | 'createdAt'>): CustomAssistant => {
    const newAsst: CustomAssistant = {
      ...data,
      id: 'asst_' + Date.now(),
      createdAt: Date.now()
    };
    setAssistants(prev => [newAsst, ...prev]);
    return newAsst;
  };

  const deleteAssistant = (id: string) => {
    setAssistants(prev => prev.filter(a => a.id !== id));
  };

  // Prompts Library State
  const DEFAULT_PROMPTS: PromptTemplate[] = [
    {
      id: 'p_1',
      title: 'Code Refactor & Strict Types',
      prompt: 'Refactor the following code to improve execution performance, strict TypeScript type safety, error handling, and modular architecture:\n\n[Paste Code Here]',
      category: 'Coding',
      tags: ['typescript', 'refactor', 'clean-code']
    },
    {
      id: 'p_2',
      title: 'Executive Summary & Action Items',
      prompt: 'Provide a 5-bullet executive summary and an actionable list of next steps, responsibilities, and key takeaways from the following document:\n\n[Paste Document Here]',
      category: 'Writing',
      tags: ['summary', 'productivity', 'executive']
    },
    {
      id: 'p_3',
      title: 'Deep Research Synthesis & Proof',
      prompt: 'Explain the core logic, mathematical proofs, key arguments, and real-world implications for:\n\n[Insert Subject Here]',
      category: 'Research',
      tags: ['math', 'logic', 'research']
    },
    {
      id: 'p_4',
      title: '60-Second Short Script & Storyboard',
      prompt: 'Create a timestamped 60-second viral Short video script and visual storyboard for: "[Topic]". Include timestamped segments, voiceover lines, visual B-roll cues, and text graphics.',
      category: 'Productivity',
      tags: ['script', 'video', 'storyboard']
    }
  ];

  const [prompts, setPrompts] = useState<PromptTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PROMPTS);
      return saved ? JSON.parse(saved) : DEFAULT_PROMPTS;
    } catch {
      return DEFAULT_PROMPTS;
    }
  });

  const savePrompt = (data: Omit<PromptTemplate, 'id'>): PromptTemplate => {
    const newP: PromptTemplate = { ...data, id: 'prompt_' + Date.now() };
    setPrompts(prev => [newP, ...prev]);
    return newP;
  };

  const deletePrompt = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
  };

  // AI Memory State
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.MEMORIES);
      return saved ? JSON.parse(saved) : [
        { id: 'mem_1', text: 'Prefers TypeScript over plain JavaScript for all code examples', createdAt: Date.now() - 86400000, category: 'preference' },
        { id: 'mem_2', text: 'Focuses on clean UI/UX with Tailwind CSS styling', createdAt: Date.now() - 43200000, category: 'preference' }
      ];
    } catch {
      return [];
    }
  });

  const addMemory = (text: string, category: 'preference' | 'fact' | 'instruction' = 'preference') => {
    if (!text.trim()) return;
    const item: MemoryItem = { id: 'mem_' + Date.now(), text: text.trim(), createdAt: Date.now(), category };
    setMemories(prev => [item, ...prev]);
  };

  const deleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const clearMemories = () => {
    setMemories([]);
  };

  // Artifacts / Workspace State
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ARTIFACTS);
      return saved ? JSON.parse(saved) : [
        {
          id: 'art_1',
          title: 'EventBus Module Artifact',
          type: 'code',
          language: 'typescript',
          content: `export class EventBus<T extends Record<string, any>> {\n  private listeners = new Map<keyof T, Set<(data: any) => void>>();\n\n  on<K extends keyof T>(event: K, fn: (data: T[K]) => void) {\n    if (!this.listeners.has(event)) this.listeners.set(event, new Set());\n    this.listeners.get(event)!.add(fn);\n  }\n}`,
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 86400000
        }
      ];
    } catch {
      return [];
    }
  });

  const [activeArtifact, setActiveArtifact] = useState<ArtifactItem | null>(null);

  const saveArtifact = (data: Omit<ArtifactItem, 'id' | 'createdAt' | 'updatedAt'>): ArtifactItem => {
    const art: ArtifactItem = {
      ...data,
      id: 'art_' + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setArtifacts(prev => [art, ...prev]);
    setActiveArtifact(art);
    return art;
  };

  // Save Assistants, Prompts, Memories, Artifacts Effects
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ASSISTANTS, JSON.stringify(assistants));
  }, [assistants]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
  }, [prompts]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ARTIFACTS, JSON.stringify(artifacts));
  }, [artifacts]);
  // Models & Sync State
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSynced: null,
    isSyncing: false,
    totalModels: 0,
    glmModelsCount: 0,
    freeModelsCount: 0
  });

  // Mode and Model selection
  const [currentMode, setCurrentModeState] = useState<ModelMode>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_KEYS.MODE) as ModelMode) || settings.general.defaultMode || 'AUTO';
  });

  const [selectedModelId, setSelectedModelIdState] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.MODEL_ID) || null;
  });

  // Providers & Keys
  const [providerKeys, setProviderKeys] = useState<ProviderKeys>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.KEYS);
      return saved ? JSON.parse(saved) : { openrouter: '', nvidia: '', gemini: '' };
    } catch {
      return { openrouter: '', nvidia: '', gemini: '' };
    }
  });

  const [providerStatus, setProviderStatus] = useState<ProviderStatusMap>({
    openrouter: { configured: false, connected: false },
    nvidia: { configured: false, connected: false },
    gemini: { configured: false, connected: false }
  });

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.FAVORITES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Theme State
  const [theme, setThemeState] = useState<'dark' | 'light' | 'system'>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as 'dark' | 'light' | 'system') || settings.appearance.theme || 'dark';
  });

  // Conversations State
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CONVERSATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load conversations:', e);
    }
    const initialId = 'conv_' + Date.now();
    return [{
      id: initialId,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mode: 'AUTO',
      messages: []
    }];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_ID);
    return saved || conversations[0]?.id || 'conv_' + Date.now();
  });

  // Streaming & Generation State
  const [isStreaming, setIsStreaming] = useState(false);
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [streamError, setStreamError] = useState<ChatMessageErrorDetails | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Files & Attachments State
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);

  // Projects State
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_PROJECT) || null;
  });

  // AI Tools State
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Theme Application Effect with System Mode Listener
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const body = document.body;
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDark) {
        root.classList.add('dark');
        body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, theme);

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  // Global Keyboard Shortcuts Effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.code === 'KeyN') {
        e.preventDefault();
        createNewChat();
      } else if (isMod && e.code === 'KeyB') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      } else if (isMod && e.code === 'KeyI') {
        e.preventDefault();
        setActiveTab('chat');
        setTimeout(() => composerRef.current?.focus(), 50);
      } else if (isMod && (e.code === 'Slash' || e.key === '?')) {
        e.preventDefault();
        setIsShortcutsHelpOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save Settings Effect
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Save Conversations Effect
  useEffect(() => {
    if (settings.privacy.saveHistoryLocally) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      } catch (e) {
        console.warn('Failed to save conversations:', e);
      }
    }
  }, [conversations, settings.privacy.saveHistoryLocally]);

  // Save Active ID Effect
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_ID, activeConversationId);
  }, [activeConversationId]);

  // Save Keys Effect
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.KEYS, JSON.stringify(providerKeys));
  }, [providerKeys]);

  // Save Favorites Effect
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  // Save Active Project Effect
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_PROJECT, activeProjectId);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ACTIVE_PROJECT);
    }
  }, [activeProjectId]);

  // Initial Load Data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const statusData = await api.fetchProviderStatus();
        setProviderStatus(statusData);
      } catch (e) {
        console.warn('Initial provider status fetch error:', e);
      }

      try {
        const modelsData = await api.fetchModels();
        setModels(modelsData.models);
        setSyncStatus(modelsData.status);
      } catch (e) {
        console.warn('Initial models fetch error:', e);
      }

      try {
        const fileRes = await api.fetchFiles();
        setFiles(fileRes.files);
      } catch (e) {
        console.warn('Initial files fetch error:', e);
      }

      try {
        const projRes = await api.fetchProjects();
        setProjects(projRes.projects);
      } catch (e) {
        console.warn('Initial projects fetch error:', e);
      }
    };

    loadInitialData();
  }, []);

  const refreshFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await api.fetchFiles();
      setFiles(res.files);
    } catch (e) {
      console.warn('Failed to refresh files:', e);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const refreshModels = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const res = await api.syncModels(providerKeys);
      setModels(res.models);
      setSyncStatus(res.status);
    } catch (err: any) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false, error: err.message }));
      throw err;
    }
  };

  const setProviderKey = (provider: ProviderType, key: string) => {
    setProviderKeys(prev => ({ ...prev, [provider]: key }));
  };

  const testProvider = async (provider: ProviderType) => {
    const key = providerKeys[provider];
    const res = await api.testProviderConnection(provider, key);
    setProviderStatus(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        configured: Boolean(key),
        connected: res.success,
        latencyMs: res.latencyMs,
        lastTested: Date.now(),
        error: res.error
      }
    }));
    return res;
  };

  const setMode = (mode: ModelMode) => {
    setCurrentModeState(mode);
    localStorage.setItem(LOCAL_STORAGE_KEYS.MODE, mode);
  };

  const selectModel = (modelId: string | null, mode?: ModelMode) => {
    setSelectedModelIdState(modelId);
    if (modelId) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.MODEL_ID, modelId);
      if (mode) {
        setMode(mode);
      } else {
        setMode('MANUAL');
      }
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.MODEL_ID);
      setMode('AUTO');
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0] || null;
  const selectedModel = models.find(m => m.id === selectedModelId) || null;

  const createNewChat = (mode: ModelMode = 'AUTO', modelId?: string, projectId?: string) => {
    const newId = 'conv_' + Date.now();
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mode,
      selectedModelId: modelId || selectedModelId || undefined,
      projectId: projectId || activeProjectId || undefined,
      messages: []
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newId);
    setActiveTab('chat');
    setIsSidebarOpen(false);
  };

  const selectConversation = (id: string) => {
    setActiveConversationId(id);
    setActiveTab('chat');
    setIsSidebarOpen(false);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        const fallbackId = 'conv_' + Date.now();
        return [{
          id: fallbackId,
          title: 'New Conversation',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          mode: 'AUTO',
          messages: []
        }];
      }
      return filtered;
    });

    if (activeConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
      }
    }
  };

  const renameConversation = (id: string, title: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title, updatedAt: Date.now() } : c));
  };

  const togglePinConversation = (id: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c));
  };

  const toggleArchiveConversation = (id: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, isArchived: !c.isArchived } : c));
  };

  const duplicateConversation = (id: string) => {
    const target = conversations.find(c => c.id === id);
    if (!target) return;
    const newId = 'conv_' + Date.now();
    const dup: Conversation = {
      ...target,
      id: newId,
      title: `${target.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: target.messages.map(m => ({ ...m, id: 'msg_' + Math.random().toString(36).slice(2) }))
    };
    setConversations(prev => [dup, ...prev]);
    setActiveConversationId(newId);
  };

  const shareConversation = (id: string): string => {
    const url = `${window.location.origin}/share/conv_${id.slice(-8)}`;
    setConversations(prev => prev.map(c => c.id === id ? { ...c, sharedUrl: url } : c));
    return url;
  };

  const clearAllConversations = () => {
    const freshId = 'conv_' + Date.now();
    const fresh: Conversation = {
      id: freshId,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mode: 'AUTO',
      messages: []
    };
    setConversations([fresh]);
    setActiveConversationId(freshId);
  };

  const toggleFavorite = (modelId: string) => {
    setFavorites(prev => 
      prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId]
    );
  };

  const setTheme = (t: 'dark' | 'light' | 'system') => {
    setThemeState(t);
    setSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, theme: t }
    }));
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    if (updates.appearance?.theme) {
      setThemeState(updates.appearance.theme);
    }
    setSettings(prev => ({
      ...prev,
      ...updates,
      general: { ...prev.general, ...updates.general },
      appearance: { ...prev.appearance, ...updates.appearance },
      ai: { ...prev.ai, ...updates.ai },
      files: { ...prev.files, ...updates.files },
      chat: { ...prev.chat, ...updates.chat },
      privacy: { ...prev.privacy, ...updates.privacy }
    }));
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setGenerationState('idle');
  };

  // Reactions & Exporting
  const toggleMessageReaction = (messageId: string, emoji: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        const updatedMsgs = conv.messages.map(msg => {
          if (msg.id === messageId) {
            const currentReactions = { ...(msg.reactions || {}) };
            if (currentReactions[emoji]) {
              delete currentReactions[emoji];
            } else {
              currentReactions[emoji] = true;
            }
            return { ...msg, reactions: currentReactions };
          }
          return msg;
        });
        return { ...conv, messages: updatedMsgs };
      }
      return conv;
    }));
  };

  const exportConversation = (convId: string, format: 'json' | 'text' | 'md') => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;

    let content = '';
    let filename = `${(conv.title || 'conversation').replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}`;
    let mimeType = 'text/plain';

    if (format === 'json') {
      content = JSON.stringify(conv, null, 2);
      filename += '.json';
      mimeType = 'application/json';
    } else if (format === 'md') {
      content = `# ${conv.title || 'Conversation Transcript'}\nDate: ${new Date(conv.createdAt).toLocaleString()}\n\n`;
      for (const m of conv.messages) {
        content += `### ${m.role === 'user' ? 'User' : m.modelDisplayName || 'AI Assistant'}\n${m.content}\n\n`;
      }
      filename += '.md';
      mimeType = 'text/markdown';
    } else {
      content = `${conv.title || 'Conversation Transcript'}\nDate: ${new Date(conv.createdAt).toLocaleString()}\n\n`;
      for (const m of conv.messages) {
        content += `[${m.role === 'user' ? 'USER' : 'ASSISTANT'}]\n${m.content}\n\n`;
      }
      filename += '.txt';
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pending Attachments Helpers
  const addPendingAttachment = (att: ChatAttachment) => {
    setPendingAttachments(prev => [...prev, att]);
  };

  const removePendingAttachment = (attId: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== attId));
  };

  const clearPendingAttachments = () => {
    setPendingAttachments([]);
  };

  const attachFileToCurrentChat = (file: FileItem) => {
    const att: ChatAttachment = {
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      url: file.url,
      previewUrl: file.previewUrl,
      textContent: file.textContent
    };
    addPendingAttachment(att);
    setActiveTab('chat');
  };

  // Files API Operations
  const uploadFile = async (file: File, projectId?: string): Promise<FileItem> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const isText = file.type.includes('text') || 
                     file.type.includes('json') || 
                     file.type.includes('javascript') || 
                     file.type.includes('typescript') ||
                     /\.(txt|md|json|csv|ts|js|py|html|css|yaml|yml)$/i.test(file.name);

      reader.onload = async () => {
        try {
          let base64Data: string | undefined = undefined;
          let textContent: string | undefined = undefined;

          if (isText && typeof reader.result === 'string') {
            textContent = reader.result;
          } else if (reader.result) {
            base64Data = reader.result as string;
          }

          const res = await api.uploadFile({
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            base64Data,
            textContent,
            projectId: projectId || activeProjectId || undefined
          });

          setFiles(prev => [res.file, ...prev]);
          resolve(res.file);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file locally'));

      if (isText) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  const deleteFile = async (id: string) => {
    await api.deleteFile(id);
    setFiles(prev => prev.filter(f => f.id !== id));
    setPendingAttachments(prev => prev.filter(a => a.id !== id));
  };

  const renameFile = async (id: string, newName: string) => {
    const res = await api.renameFile(id, newName);
    setFiles(prev => prev.map(f => f.id === id ? res.file : f));
  };

  const analyzeFile = async (id: string): Promise<string> => {
    const res = await api.analyzeFile(id);
    setFiles(prev => prev.map(f => f.id === id ? { ...f, summary: res.summary } : f));
    return res.summary;
  };

  // Projects API Operations
  const createProject = async (data: { title: string; description?: string; systemInstruction?: string; defaultModelId?: string }): Promise<ProjectItem> => {
    const res = await api.createProject(data);
    setProjects(prev => [res.project, ...prev]);
    return res.project;
  };

  const updateProject = async (id: string, updates: Partial<ProjectItem>) => {
    const res = await api.updateProject(id, updates);
    setProjects(prev => prev.map(p => p.id === id ? res.project : p));
  };

  const deleteProject = async (id: string) => {
    await api.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  };

  // Image Generation
  const generateImage = async (prompt: string, aspectRatio?: string, style?: string): Promise<FileItem> => {
    setIsGeneratingImage(true);
    setGenerationState('generating_image');
    try {
      const res = await api.generateImage({ prompt, aspectRatio, style });
      setFiles(prev => [res.file, ...prev]);
      return res.file;
    } finally {
      setIsGeneratingImage(false);
      setGenerationState('idle');
    }
  };

  // Multi-Model Consensus / Ensemble Execution
  const sendEnsembleMessage = async (content: string) => {
    const attachmentsToSend = [...pendingAttachments];
    if (!content.trim() && attachmentsToSend.length === 0) return;

    clearPendingAttachments();

    // Select 3 top models across providers
    const targetModels: { modelId: string; displayName: string; provider: ProviderType }[] = [
      { modelId: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', provider: 'gemini' },
      { modelId: 'z-ai/glm-5.3', displayName: 'GLM 5.3 (OpenRouter)', provider: 'openrouter' },
      { modelId: 'nvidia/nemotron-4-340b-instruct', displayName: 'NVIDIA Nemotron-4 340B', provider: 'nvidia' }
    ];

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined
    };

    const initialEnsemble: EnsembleComparison[] = targetModels.map(m => ({
      modelId: m.modelId,
      modelDisplayName: m.displayName,
      provider: m.provider,
      content: '',
      isStreaming: true
    }));

    const assistantMsgId = 'msg_' + (Date.now() + 1);
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      ensembleResponses: initialEnsemble
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        return {
          ...conv,
          title: conv.messages.length === 0 ? content.slice(0, 32) : conv.title,
          updatedAt: Date.now(),
          messages: [...conv.messages, userMessage, assistantMsg]
        };
      }
      return conv;
    }));

    setIsStreaming(true);
    setGenerationState('generating');

    const currentConv = conversations.find(c => c.id === activeConversationId);
    const existingMessages = currentConv?.messages || [];
    const outgoingMessages = [...existingMessages, userMessage].map(m => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments
    }));

    // Trigger parallel streaming for all 3 models
    await Promise.all(
      targetModels.map(async (target, idx) => {
        try {
          await api.streamChat(
            {
              messages: outgoingMessages,
              mode: 'MANUAL',
              modelId: target.modelId,
              provider: target.provider,
              keys: providerKeys,
              fallbackEnabled: true
            },
            (chunk) => {
              setConversations(prev => prev.map(conv => {
                if (conv.id === activeConversationId) {
                  const updatedMsgs = conv.messages.map(m => {
                    if (m.id === assistantMsgId && m.ensembleResponses) {
                      const updatedEns = [...m.ensembleResponses];
                      if (updatedEns[idx]) {
                        updatedEns[idx] = {
                          ...updatedEns[idx],
                          content: updatedEns[idx].content + chunk
                        };
                      }
                      return { ...m, ensembleResponses: updatedEns };
                    }
                    return m;
                  });
                  return { ...conv, messages: updatedMsgs };
                }
                return conv;
              }));
            },
            (meta) => {
              setConversations(prev => prev.map(conv => {
                if (conv.id === activeConversationId) {
                  const updatedMsgs = conv.messages.map(m => {
                    if (m.id === assistantMsgId && m.ensembleResponses) {
                      const updatedEns = [...m.ensembleResponses];
                      if (updatedEns[idx]) {
                        updatedEns[idx] = {
                          ...updatedEns[idx],
                          isStreaming: false,
                          latencyMs: meta.latencyMs
                        };
                      }
                      return { ...m, ensembleResponses: updatedEns };
                    }
                    return m;
                  });
                  return { ...conv, messages: updatedMsgs };
                }
                return conv;
              }));
            },
            (err) => {
              setConversations(prev => prev.map(conv => {
                if (conv.id === activeConversationId) {
                  const updatedMsgs = conv.messages.map(m => {
                    if (m.id === assistantMsgId && m.ensembleResponses) {
                      const updatedEns = [...m.ensembleResponses];
                      if (updatedEns[idx]) {
                        updatedEns[idx] = {
                          ...updatedEns[idx],
                          isStreaming: false,
                          error: err.message || 'Model execution error'
                        };
                      }
                      return { ...m, ensembleResponses: updatedEns };
                    }
                    return m;
                  });
                  return { ...conv, messages: updatedMsgs };
                }
                return conv;
              }));
            }
          );
        } catch (e: any) {
          console.warn(`Ensemble target ${target.modelId} failed:`, e);
        }
      })
    );

    setIsStreaming(false);
    setGenerationState('idle');
  };

  // Send Single Message
  const sendMessage = async (content: string, passedAttachments?: ChatAttachment[]) => {
    if (isEnsembleMode) {
      return sendEnsembleMessage(content);
    }

    const attachmentsToSend = passedAttachments || [...pendingAttachments];
    if ((!content.trim() && attachmentsToSend.length === 0) || isStreaming) return;

    setStreamError(null);
    clearPendingAttachments();

    let initialGenState: GenerationState = 'thinking';
    if (attachmentsToSend.some(a => a.type.startsWith('image/'))) {
      initialGenState = 'reading_image';
    } else if (attachmentsToSend.length > 0) {
      initialGenState = 'analyzing_file';
    }
    setGenerationState(initialGenState);

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined
    };

    const assistantMsgId = 'msg_' + (Date.now() + 1);
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      isThinking: settings.ai.enableThinking
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        const isFirst = conv.messages.length === 0;
        const newTitle = isFirst ? (content.trim().slice(0, 32) || 'File Analysis') : conv.title;
        return {
          ...conv,
          title: newTitle,
          updatedAt: Date.now(),
          messages: [...conv.messages, userMessage, initialAssistantMessage]
        };
      }
      return conv;
    }));

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const activeProject = projects.find(p => p.id === activeProjectId);
    const effectiveSystemInstruction = activeProject?.systemInstruction || settings.chat.systemInstruction || undefined;

    const currentConv = conversations.find(c => c.id === activeConversationId);
    const existingMessages = currentConv?.messages || [];
    const outgoingMessages = [...existingMessages, userMessage].map(m => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments
    }));

    try {
      await api.streamChat(
        {
          messages: outgoingMessages,
          mode: currentMode,
          modelId: selectedModelId || undefined,
          temperature: settings.ai.temperature,
          maxTokens: settings.ai.maxOutputTokens,
          systemInstruction: effectiveSystemInstruction,
          keys: providerKeys,
          fallbackEnabled: settings.ai.fallbackEnabled !== false
        },
        (chunk) => {
          setConversations(prev => prev.map(conv => {
            if (conv.id === activeConversationId) {
              const updatedMsgs = conv.messages.map(msg => {
                if (msg.id === assistantMsgId) {
                  return { ...msg, content: msg.content + chunk, isThinking: false };
                }
                return msg;
              });
              return { ...conv, messages: updatedMsgs };
            }
            return conv;
          }));
        },
        (meta) => {
          setConversations(prev => prev.map(conv => {
            if (conv.id === activeConversationId) {
              const updatedMsgs = conv.messages.map(msg => {
                if (msg.id === assistantMsgId) {
                  return {
                    ...msg,
                    isStreaming: false,
                    isThinking: false,
                    modelId: meta.modelId,
                    modelDisplayName: meta.modelDisplayName,
                    provider: meta.provider,
                    latencyMs: meta.latencyMs,
                    usage: meta.usage,
                    requestId: meta.requestId,
                    fallbackUsed: meta.fallbackUsed
                  };
                }
                return msg;
              });
              return { ...conv, messages: updatedMsgs };
            }
            return conv;
          }));
          setIsStreaming(false);
          setGenerationState('idle');
          abortControllerRef.current = null;
        },
        (error) => {
          setStreamError(error);
          setConversations(prev => prev.map(conv => {
            if (conv.id === activeConversationId) {
              const updatedMsgs = conv.messages.map(msg => {
                if (msg.id === assistantMsgId) {
                  return {
                    ...msg,
                    isStreaming: false,
                    isThinking: false,
                    isError: true,
                    errorDetails: error
                  };
                }
                return msg;
              });
              return { ...conv, messages: updatedMsgs };
            }
            return conv;
          }));
          setIsStreaming(false);
          setGenerationState('idle');
          abortControllerRef.current = null;
        },
        (state) => {
          setGenerationState(state);
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorDetails: ChatMessageErrorDetails = {
          message: err.message || 'Network request failed',
          code: 500,
          type: 'network_error',
          suggestion: 'Please verify server connectivity and API keys.'
        };
        setStreamError(errorDetails);
        setConversations(prev => prev.map(conv => {
          if (conv.id === activeConversationId) {
            const updatedMsgs = conv.messages.map(msg => {
              if (msg.id === assistantMsgId) {
                return {
                  ...msg,
                  isStreaming: false,
                  isThinking: false,
                  isError: true,
                  errorDetails
                };
              }
              return msg;
            });
            return { ...conv, messages: updatedMsgs };
          }
          return conv;
        }));
      }
      setIsStreaming(false);
      setGenerationState('idle');
      abortControllerRef.current = null;
    }
  };

  const editAndResendMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim() || isStreaming) return;
    const currentConv = conversations.find(c => c.id === activeConversationId);
    if (!currentConv) return;

    const msgIndex = currentConv.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const targetMsg = currentConv.messages[msgIndex];
    const truncated = currentConv.messages.slice(0, msgIndex);
    setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, messages: truncated } : c));

    await sendMessage(newContent, targetMsg.attachments);
  };

  const regenerateMessage = async (messageId: string) => {
    if (isStreaming) return;
    const currentConv = conversations.find(c => c.id === activeConversationId);
    if (!currentConv) return;

    const msgIndex = currentConv.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    let priorUserMsg: ChatMessage | null = null;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (currentConv.messages[i].role === 'user') {
        priorUserMsg = currentConv.messages[i];
        break;
      }
    }

    if (!priorUserMsg) return;

    const truncated = currentConv.messages.slice(0, msgIndex);
    setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, messages: truncated } : c));

    await sendMessage(priorUserMsg.content, priorUserMsg.attachments);
  };

  const deleteMessage = (messageId: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id === activeConversationId) {
        return {
          ...c,
          messages: c.messages.filter(m => m.id !== messageId)
        };
      }
      return c;
    }));
  };

  return (
    <HubContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isSidebarOpen,
        setIsSidebarOpen,
        isModelSelectorOpen,
        setIsModelSelectorOpen,
        isShortcutsHelpOpen,
        setIsShortcutsHelpOpen,
        models,
        syncStatus,
        refreshModels,
        currentMode,
        setMode,
        selectedModelId,
        selectedModelIds,
        toggleSelectedModelId,
        clearSelectedModelIds,
        selectedModel,
        selectModel,
        testingModel,
        setTestingModel,
        isWebSearchEnabled,
        setIsWebSearchEnabled,
        isEnsembleMode,
        setIsEnsembleMode,
        sendEnsembleMessage,
        providerKeys,
        setProviderKey,
        providerStatus,
        testProvider,
        conversations,
        activeConversationId,
        activeConversation,
        createNewChat,
        selectConversation,
        deleteConversation,
        renameConversation,
        togglePinConversation,
        toggleArchiveConversation,
        duplicateConversation,
        shareConversation,
        clearAllConversations,
        sendMessage,
        editAndResendMessage,
        deleteMessage,
        toggleMessageReaction,
        exportConversation,
        stopStreaming,
        regenerateMessage,
        isStreaming,
        generationState,
        streamError,
        composerRef,
        pendingAttachments,
        addPendingAttachment,
        removePendingAttachment,
        clearPendingAttachments,
        attachFileToCurrentChat,
        files,
        isLoadingFiles,
        refreshFiles,
        uploadFile,
        deleteFile,
        renameFile,
        analyzeFile,
        projects,
        activeProjectId,
        setActiveProjectId,
        createProject,
        updateProject,
        deleteProject,
        assistants,
        createAssistant,
        deleteAssistant,
        prompts,
        savePrompt,
        deletePrompt,
        memories,
        addMemory,
        deleteMemory,
        clearMemories,
        artifacts,
        activeArtifact,
        setActiveArtifact,
        saveArtifact,
        generateImage,
        isGeneratingImage,
        settings,
        updateSettings,
        favorites,
        toggleFavorite,
        theme,
        setTheme
      }}
    >
      {children}
    </HubContext.Provider>
  );
};

export const useHub = (): HubContextType => {
  const context = useContext(HubContext);
  if (!context) {
    throw new Error('useHub must be used within a HubProvider');
  }
  return context;
};
