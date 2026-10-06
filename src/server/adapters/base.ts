import { ModelInfo, ProviderType, ChatMessageErrorDetails, ChatAttachment } from '../../types/index.ts';

export interface ChatCompletionParams {
  modelId: string;
  messages: { 
    role: 'user' | 'assistant' | 'system'; 
    content: string;
    attachments?: ChatAttachment[];
  }[];
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
}

export interface StreamCallbacks {
  onChunk: (delta: string) => void;
  onMeta?: (meta: any) => void;
}

export interface CompletionResult {
  content: string;
  requestId?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  latencyMs: number;
}

export interface ProviderAdapter {
  provider: ProviderType;
  testConnection(apiKey: string): Promise<{ success: boolean; latencyMs: number; error?: string }>;
  listModels(apiKey?: string): Promise<ModelInfo[]>;
  chat(params: ChatCompletionParams): Promise<CompletionResult>;
  streamChat(params: ChatCompletionParams, callbacks: StreamCallbacks): Promise<CompletionResult>;
  normalizeError(error: any): ChatMessageErrorDetails;
}
