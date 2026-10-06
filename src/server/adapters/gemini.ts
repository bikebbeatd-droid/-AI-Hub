import { GoogleGenAI } from '@google/genai';
import { ModelInfo, ChatMessageErrorDetails } from '../../types/index.ts';
import { ProviderAdapter, ChatCompletionParams, StreamCallbacks, CompletionResult } from './base.ts';

const GEMINI_MODELS: Omit<ModelInfo, 'lastSynced'>[] = [
  {
    id: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    provider: 'gemini',
    ownedBy: 'Google',
    description: 'Fast, highly versatile multimodal model built for low-latency reasoning and general tasks.',
    contextLength: 1048576,
    inputModalities: ['text', 'image'],
    outputModalities: ['text'],
    pricing: { prompt: 0.0001, completion: 0.0004, isFree: true },
    isFree: true,
    supportsVision: true,
    supportsReasoning: true,
    supportsTools: true,
    supportsStreaming: true,
    supportsCoding: true,
    status: 'available',
    tags: ['Google', 'Fast', 'Vision', 'Coding', 'Free']
  },
  {
    id: 'gemini-3.1-pro-preview',
    displayName: 'Gemini 3.1 Pro (Preview)',
    provider: 'gemini',
    ownedBy: 'Google',
    description: 'Google’s state-of-the-art flagship model for complex coding, scientific reasoning, and synthesis.',
    contextLength: 2097152,
    inputModalities: ['text', 'image'],
    outputModalities: ['text'],
    pricing: { prompt: 0.00125, completion: 0.005, isFree: false },
    isFree: false,
    supportsVision: true,
    supportsReasoning: true,
    supportsTools: true,
    supportsStreaming: true,
    supportsCoding: true,
    status: 'available',
    tags: ['Google', 'Reasoning', 'Coding', 'Flagship', 'Vision']
  },
  {
    id: 'gemini-flash-latest',
    displayName: 'Gemini Flash Latest',
    provider: 'gemini',
    ownedBy: 'Google',
    description: 'Always up-to-date Gemini Flash checkpoint with balanced speed and reasoning.',
    contextLength: 1048576,
    inputModalities: ['text', 'image'],
    outputModalities: ['text'],
    pricing: { prompt: 0.0001, completion: 0.0004, isFree: true },
    isFree: true,
    supportsVision: true,
    supportsReasoning: true,
    supportsTools: true,
    supportsStreaming: true,
    supportsCoding: true,
    status: 'available',
    tags: ['Google', 'Fast', 'Vision', 'Free']
  }
];

export class GeminiAdapter implements ProviderAdapter {
  provider = 'gemini' as const;

  async testConnection(apiKey: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, latencyMs: 0, error: 'Gemini API key is missing' };
    }

    const start = Date.now();
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'ping'
      });
      const latencyMs = Date.now() - start;
      if (response && response.text) {
        return { success: true, latencyMs };
      }
      return { success: true, latencyMs };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return { success: false, latencyMs, error: err.message || 'Gemini API call failed' };
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    const now = new Date().toISOString();
    return GEMINI_MODELS.map(m => ({
      ...m,
      lastSynced: now
    }));
  }

  async chat(params: ChatCompletionParams): Promise<CompletionResult> {
    const start = Date.now();
    const ai = new GoogleGenAI({ apiKey: params.apiKey.trim() });

    // Format contents with multimodal support
    const contents = params.messages.map(m => {
      const parts: any[] = [];
      if (m.attachments && m.attachments.length > 0) {
        for (const att of m.attachments) {
          if (att.base64 && (att.type.startsWith('image/') || att.type === 'application/pdf')) {
            const cleanBase64 = att.base64.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: att.type,
                data: cleanBase64
              }
            });
          } else if (att.textContent) {
            parts.push({
              text: `[Attached File: ${att.name}]\n${att.textContent}\n`
            });
          }
        }
      }
      parts.push({ text: m.content || '(Analyze attachments)' });

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts
      };
    });

    const config: any = {};
    if (params.temperature !== undefined) config.temperature = params.temperature;
    if (params.maxTokens !== undefined) config.maxOutputTokens = params.maxTokens;
    if (params.systemInstruction) config.systemInstruction = params.systemInstruction;

    const response = await ai.models.generateContent({
      model: params.modelId,
      contents,
      config: Object.keys(config).length > 0 ? config : undefined
    });

    const latencyMs = Date.now() - start;
    const content = response.text || '';

    return {
      content,
      requestId: `gemini-${Date.now()}`,
      usage: response.usageMetadata ? {
        promptTokens: response.usageMetadata.promptTokenCount,
        completionTokens: response.usageMetadata.candidatesTokenCount,
        totalTokens: response.usageMetadata.totalTokenCount
      } : undefined,
      latencyMs
    };
  }

  async streamChat(params: ChatCompletionParams, callbacks: StreamCallbacks): Promise<CompletionResult> {
    const start = Date.now();
    const ai = new GoogleGenAI({ apiKey: params.apiKey.trim() });

    const contents = params.messages.map(m => {
      const parts: any[] = [];
      if (m.attachments && m.attachments.length > 0) {
        for (const att of m.attachments) {
          if (att.base64 && (att.type.startsWith('image/') || att.type === 'application/pdf')) {
            const cleanBase64 = att.base64.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: att.type,
                data: cleanBase64
              }
            });
          } else if (att.textContent) {
            parts.push({
              text: `[Attached File: ${att.name}]\n${att.textContent}\n`
            });
          }
        }
      }
      parts.push({ text: m.content || '(Analyze attachments)' });

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts
      };
    });

    const config: any = {};
    if (params.temperature !== undefined) config.temperature = params.temperature;
    if (params.maxTokens !== undefined) config.maxOutputTokens = params.maxTokens;
    if (params.systemInstruction) config.systemInstruction = params.systemInstruction;

    const responseStream = await ai.models.generateContentStream({
      model: params.modelId,
      contents,
      config: Object.keys(config).length > 0 ? config : undefined
    });

    let fullContent = '';
    for await (const chunk of responseStream) {
      const delta = chunk.text;
      if (delta) {
        fullContent += delta;
        callbacks.onChunk(delta);
      }
    }

    const latencyMs = Date.now() - start;

    return {
      content: fullContent,
      requestId: `gemini-${Date.now()}`,
      latencyMs
    };
  }

  normalizeError(error: any): ChatMessageErrorDetails {
    const rawMsg = error?.message || (typeof error === 'string' ? error : 'Gemini API error');

    if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('403') || rawMsg.includes('unauthorized')) {
      return {
        message: 'Google Gemini authentication failed: Invalid API key.',
        code: 401,
        type: 'authentication_error',
        technicalDetails: rawMsg,
        suggestion: 'Ensure GEMINI_API_KEY is configured in your project secrets or Settings.'
      };
    }

    if (rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('429')) {
      return {
        message: 'Google Gemini rate limit reached or quota exhausted.',
        code: 429,
        type: 'rate_limit',
        technicalDetails: rawMsg,
        suggestion: 'Please wait a moment before sending more messages.'
      };
    }

    return {
      message: `Gemini error: ${rawMsg}`,
      code: 'GEMINI_ERROR',
      type: 'provider_error',
      technicalDetails: rawMsg,
      suggestion: 'Check prompt content or try an alternative model.'
    };
  }
}
