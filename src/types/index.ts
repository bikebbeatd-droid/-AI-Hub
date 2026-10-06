export type ProviderType = 'openrouter' | 'nvidia' | 'gemini';

export type ModelMode = 
  | 'AUTO' 
  | 'BEST' 
  | 'FAST' 
  | 'FREE' 
  | 'CODING' 
  | 'REASONING' 
  | 'VISION' 
  | 'MANUAL';

export interface ModelPricing {
  prompt: number; // cost per 1M tokens or per token
  completion: number;
  isFree: boolean;
}

export interface ModelInfo {
  id: string; // Exact provider model ID (e.g. "z-ai/glm-5.3", "meta/llama-3.1-70b-instruct")
  displayName: string;
  provider: ProviderType;
  ownedBy: string;
  description: string;
  contextLength: number;
  inputModalities: string[];
  outputModalities: string[];
  pricing: ModelPricing;
  isFree: boolean;
  supportsVision: boolean;
  supportsReasoning: boolean;
  supportsTools: boolean;
  supportsStreaming: boolean;
  supportsCoding: boolean;
  status: 'available' | 'degraded' | 'offline';
  lastSynced: string;
  tags?: string[];
  isGlm?: boolean;
}

export type NavigationTab = 
  | 'chat' 
  | 'files' 
  | 'tools' 
  | 'projects' 
  | 'history' 
  | 'settings' 
  | 'models' 
  | 'favorites';

export type GenerationState = 
  | 'idle' 
  | 'thinking' 
  | 'generating' 
  | 'analyzing_file' 
  | 'reading_image' 
  | 'creating_file' 
  | 'generating_image';

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  base64?: string;
  previewUrl?: string;
  textContent?: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  url: string;
  previewUrl?: string;
  uploadedAt: number;
  status: 'uploading' | 'ready' | 'analyzing' | 'error';
  textContent?: string;
  isGenerated?: boolean;
  summary?: string;
  error?: string;
  projectId?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  systemInstruction?: string;
  defaultModelId?: string;
  defaultProvider?: ProviderType;
  conversationIds: string[];
  fileIds: string[];
}

export interface ChatMessageErrorDetails {
  message: string;
  code?: number | string;
  type?: string;
  technicalDetails?: string;
  suggestion?: string;
}

export interface EnsembleComparison {
  modelId: string;
  modelDisplayName: string;
  provider: ProviderType;
  content: string;
  latencyMs?: number;
  isStreaming?: boolean;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelId?: string;
  modelDisplayName?: string;
  provider?: ProviderType;
  latencyMs?: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  requestId?: string;
  isStreaming?: boolean;
  isThinking?: boolean;
  reasoningContent?: string;
  attachments?: ChatAttachment[];
  reactions?: Record<string, boolean>;
  ensembleResponses?: EnsembleComparison[];
  isError?: boolean;
  errorDetails?: ChatMessageErrorDetails;
  fallbackUsed?: {
    originalModelId: string;
    originalProvider: ProviderType;
    reason: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mode: ModelMode;
  selectedModelId?: string;
  selectedProvider?: ProviderType;
  projectId?: string;
  systemInstruction?: string;
  isEnsembleMode?: boolean;
  ensembleModelIds?: string[];
  messages: ChatMessage[];
}

export interface AppSettings {
  general: {
    defaultMode: ModelMode;
    autoScroll: boolean;
    sendOnEnter: boolean;
  };
  appearance: {
    theme: 'dark' | 'light' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    bubbleStyle: 'minimal' | 'bordered' | 'card';
  };
  ai: {
    defaultModelId: string;
    temperature: number;
    maxOutputTokens: number;
    enableThinking: boolean;
    fallbackEnabled: boolean;
  };
  files: {
    maxFileSizeMb: number;
    autoSummarize: boolean;
  };
  chat: {
    systemInstruction: string;
    streamSpeed: 'normal' | 'fast';
    renderMarkdownMath: boolean;
  };
  privacy: {
    saveHistoryLocally: boolean;
  };
}

export interface ProviderConnectionState {
  configured: boolean;
  connected: boolean;
  latencyMs?: number;
  lastTested?: number;
  error?: string;
  modelCount?: number;
}

export interface ProviderStatusMap {
  openrouter: ProviderConnectionState;
  nvidia: ProviderConnectionState;
  gemini: ProviderConnectionState;
}

export interface SyncStatus {
  lastSynced: string | null;
  isSyncing: boolean;
  totalModels: number;
  glmModelsCount: number;
  freeModelsCount: number;
  error?: string | null;
}

export interface ChatRequestPayload {
  messages: { 
    role: 'user' | 'assistant' | 'system'; 
    content: string;
    attachments?: ChatAttachment[];
  }[];
  mode: ModelMode;
  modelId?: string;
  provider?: ProviderType;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  keys?: {
    openrouter?: string;
    nvidia?: string;
    gemini?: string;
  };
  fallbackEnabled?: boolean;
}

export interface ChatStreamChunk {
  chunk?: string;
  done?: boolean;
  meta?: {
    requestId: string;
    modelId: string;
    modelDisplayName: string;
    provider: ProviderType;
    latencyMs: number;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
    fallbackUsed?: {
      originalModelId: string;
      originalProvider: ProviderType;
      reason: string;
    };
  };
  error?: ChatMessageErrorDetails;
}
