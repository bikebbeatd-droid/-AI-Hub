import { ModelInfo, ChatMessageErrorDetails } from '../../types/index.ts';
import { ProviderAdapter, ChatCompletionParams, StreamCallbacks, CompletionResult } from './base.ts';

// Standard NVIDIA NIM models catalog
const DEFAULT_NVIDIA_MODELS: Omit<ModelInfo, 'lastSynced'>[] = [
  {
    id: 'meta/llama-3.1-70b-instruct',
    displayName: 'Meta Llama 3.1 70B Instruct',
    provider: 'nvidia',
    ownedBy: 'Meta',
    description: 'High-performance multilingual open model by Meta, hosted on NVIDIA NIM with TensorRT-LLM acceleration.',
    contextLength: 131072,
    inputModalities: ['text'],
    outputModalities: ['text'],
    pricing: { prompt: 0.00035, completion: 0.0004, isFree: false },
    isFree: false,
    supportsVision: false,
    supportsReasoning: true,
    supportsTools: true,
    supportsStreaming: true,
    supportsCoding: true,
    status: 'available',
    tags: ['Coding', 'Reasoning']
  },
  {
    id: 'meta/llama-3.1-8b-instruct',
    displayName: 'Meta Llama 3.1 8B Instruct',
    provider: 'nvidia',
    ownedBy: 'Meta',
    description: 'Fast, lightweight conversational model ideal for low-latency tasks and summarization.',
    contextLength: 131072,
    inputModalities: ['text'],
    outputModalities: ['text'],
    pricing: { prompt: 0.0001, completion: 0.0001, isFree: false },
    isFree: false,
    supportsVision: false,
    supportsReasoning: false,
    supportsTools: true,
    supportsStreaming: true,
    supportsCoding: true,
    status: 'available',
    tags: ['Fast', 'Coding']
  },
  {
    id: 'meta/llama-3.1-405b-instruct',
    displayName: 'Meta Llama 3.1 405B Instruct',
    provider: 'nvidia',
    ownedBy: 'Meta',
    description: 'Flagship frontier-class open foundation model offering state-of-the-art synthetic reasoning and coding.',
    contextLength: 131072,
    inputModalities: ['text'],
    outputModalities: ['text'],
    pricing: { prompt: 0.0018, completion: 0.002, isFree: false },
    isFree: false,
    supportsVision: false,
    supportsReasoning: true,
    supportsTools: true,
    supportsStreaming: true,
    supportsCoding: true,
    status: 'available',
    tags: ['Reasoning', 'Coding', 'Flagship']
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    displayName: 'NVIDIA Llama 3.1 Nemotron 70B',
    provider: 'nvidia',
    ownedBy: 'NVIDIA',
    description: 'Trained by NVIDIA to dramatically improve response helpfulness, reasoning clarity, and formatting precision.',
    contextLength: 131072,
    inputModalities: ['text'],
    outputModalities: ['text'],
    pricing: { prompt: 0.00035, completion: 0.0004, isFree: false },
    isFree: false,
    supportsVision: false,
    supportsReasoning: true,
    supportsTools: true,
    supportsStreaming: true,
    supportsCoding: true,
    status: 'available',
    tags: ['Reasoning', 'Coding']
  },
  {
    id: 'deepseek-ai/deepseek-r1',
    displayName: 'DeepSeek R1 (NVIDIA NIM)',
    provider: 'nvidia',
    ownedBy: 'DeepSeek',
    description: 'Frontier reasoning model with extended chain-of-thought verification for complex math and software architecture.',
    contextLength: 65536,
    inputModalities: ['text'],
    outputModalities: ['text'],
    pricing: { prompt: 0.0005, completion: 0.002, isFree: false },
    isFree: false,
    supportsVision: false,
    supportsReasoning: true,
    supportsTools: false,
    supportsStreaming: true,
    supportsCoding: true,
    status: 'available',
    tags: ['Reasoning', 'Coding']
  },
  {
    id: 'qwen/qwen2.5-72b-instruct',
    displayName: 'Qwen 2.5 72B Instruct',
    provider: 'nvidia',
    ownedBy: 'Alibaba',
    description: 'Superior polyglot reasoning and code generation foundation model.',
    contextLength: 131072,
    inputModalities: ['text'],
    outputModalities: ['text'],
    pricing: { prompt: 0.00035, completion: 0.0004, isFree: false },
    isFree: false,
    supportsVision: false,
    supportsReasoning: true,
    supportsTools: true,
    supportsStreaming: true,
    supportsCoding: true,
    status: 'available',
    tags: ['Coding', 'Reasoning']
  },
  {
    id: 'nvidia/nemotron-4-340b-instruct',
    displayName: 'NVIDIA Nemotron-4 340B Instruct',
    provider: 'nvidia',
    ownedBy: 'NVIDIA',
    description: 'Generates high quality conversational data and handles multi-turn dialogues with advanced domain grounding.',
    contextLength: 4096,
    inputModalities: ['text'],
    outputModalities: ['text'],
    pricing: { prompt: 0.0015, completion: 0.0018, isFree: false },
    isFree: false,
    supportsVision: false,
    supportsReasoning: true,
    supportsTools: true,
    supportsStreaming: true,
    supportsCoding: false,
    status: 'available',
    tags: ['Reasoning']
  }
];

export class NvidiaAdapter implements ProviderAdapter {
  provider = 'nvidia' as const;
  private baseUrl = 'https://integrate.api.nvidia.com/v1';

  async testConnection(apiKey: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, latencyMs: 0, error: 'NVIDIA API key is required (nvapi-...)' };
    }

    const start = Date.now();
    try {
      // Test with listing models or light completion
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errorText = await res.text();
        let errMsg = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(errorText);
          errMsg = parsed.detail || parsed.message || parsed.error?.message || errMsg;
        } catch {
          errMsg = errorText || errMsg;
        }
        return { success: false, latencyMs, error: errMsg };
      }

      return { success: true, latencyMs };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return { success: false, latencyMs, error: err.message || 'Connection timed out' };
    }
  }

  async listModels(apiKey?: string): Promise<ModelInfo[]> {
    const now = new Date().toISOString();

    if (apiKey && apiKey.trim()) {
      try {
        const res = await fetch(`${this.baseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            return json.data.map((m: any): ModelInfo => {
              const id = String(m.id || '');
              const ownedBy = String(m.owned_by || id.split('/')[0] || 'NVIDIA');
              const lowerId = id.toLowerCase();
              const supportsCoding = lowerId.includes('code') || lowerId.includes('coder') || lowerId.includes('llama') || lowerId.includes('qwen');
              const supportsReasoning = lowerId.includes('r1') || lowerId.includes('nemotron') || lowerId.includes('reason');
              const supportsVision = lowerId.includes('vision') || lowerId.includes('vl');

              const tags = ['NVIDIA NIM'];
              if (supportsCoding) tags.push('Coding');
              if (supportsReasoning) tags.push('Reasoning');
              if (supportsVision) tags.push('Vision');

              return {
                id, // EXACT IMMUTABLE PROVIDER ID
                displayName: id.split('/').pop()?.replace(/-/g, ' ').toUpperCase() || id,
                provider: 'nvidia',
                ownedBy,
                description: `Hosted on NVIDIA NIM container platform. ID: ${id}`,
                contextLength: 65536,
                inputModalities: supportsVision ? ['text', 'image'] : ['text'],
                outputModalities: ['text'],
                pricing: { prompt: 0.0003, completion: 0.0004, isFree: false },
                isFree: false,
                supportsVision,
                supportsReasoning,
                supportsTools: true,
                supportsStreaming: true,
                supportsCoding,
                status: 'available',
                lastSynced: now,
                tags
              };
            });
          }
        }
      } catch (e) {
        // Fall back to verified catalog
      }
    }

    return DEFAULT_NVIDIA_MODELS.map(m => ({
      ...m,
      lastSynced: now
    }));
  }

  async chat(params: ChatCompletionParams): Promise<CompletionResult> {
    const start = Date.now();
    const formattedMessages = params.messages.map(m => {
      let text = m.content || '';
      if (m.attachments && m.attachments.length > 0) {
        for (const att of m.attachments) {
          if (att.textContent) {
            text += `\n\n[Attached File: ${att.name}]\n${att.textContent}`;
          } else if (att.base64 && att.type.startsWith('image/')) {
            text += `\n\n[Attached Image: ${att.name}]`;
          }
        }
      }
      return { role: m.role, content: text };
    });

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${params.apiKey.trim()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: params.modelId, // EXACT MODEL ID
        messages: formattedMessages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2048
      }),
      signal: AbortSignal.timeout(60000)
    });

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      const errorText = await res.text();
      let parsedError: any;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = { message: errorText };
      }
      throw { status: res.status, body: parsedError, message: parsedError?.detail || parsedError?.error?.message || errorText };
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const content = choice?.message?.content || '';

    return {
      content,
      requestId: data.id,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens
      },
      latencyMs
    };
  }

  async streamChat(params: ChatCompletionParams, callbacks: StreamCallbacks): Promise<CompletionResult> {
    const start = Date.now();
    const formattedMessages = params.messages.map(m => {
      let text = m.content || '';
      if (m.attachments && m.attachments.length > 0) {
        for (const att of m.attachments) {
          if (att.textContent) {
            text += `\n\n[Attached File: ${att.name}]\n${att.textContent}`;
          } else if (att.base64 && att.type.startsWith('image/')) {
            text += `\n\n[Attached Image: ${att.name}]`;
          }
        }
      }
      return { role: m.role, content: text };
    });

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${params.apiKey.trim()}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model: params.modelId, // EXACT MODEL ID
        messages: formattedMessages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2048,
        stream: true
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (!res.ok) {
      const errorText = await res.text();
      let parsedError: any;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = { message: errorText };
      }
      throw { status: res.status, body: parsedError, message: parsedError?.detail || parsedError?.error?.message || errorText };
    }

    if (!res.body) {
      throw new Error('No response stream available from NVIDIA');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullContent = '';
    let buffer = '';
    let requestId: string | undefined;
    let usage: any = undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.id) requestId = parsed.id;
              if (parsed.usage) usage = parsed.usage;

              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                callbacks.onChunk(delta);
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    const latencyMs = Date.now() - start;

    return {
      content: fullContent,
      requestId,
      usage: usage ? {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      } : undefined,
      latencyMs
    };
  }

  normalizeError(error: any): ChatMessageErrorDetails {
    const status = error?.status || error?.statusCode;
    const rawMsg = error?.message || error?.body?.detail || (typeof error === 'string' ? error : 'Unknown NVIDIA error');

    if (status === 401 || rawMsg.toLowerCase().includes('unauthorized') || rawMsg.toLowerCase().includes('nvapi-')) {
      return {
        message: 'NVIDIA NIM authentication failed: Invalid or missing API key.',
        code: 401,
        type: 'authentication_error',
        technicalDetails: `Status: 401\nResponse: ${rawMsg}`,
        suggestion: 'Verify your NVIDIA API key (must begin with "nvapi-") in Settings -> Providers.'
      };
    }

    if (status === 404) {
      return {
        message: 'Selected model is not currently hosted on NVIDIA NIM.',
        code: 404,
        type: 'model_not_found',
        technicalDetails: `Status: 404\nResponse: ${rawMsg}`,
        suggestion: 'Choose another NVIDIA model or check the catalog.'
      };
    }

    if (status === 429) {
      return {
        message: 'NVIDIA API rate limit or quota exceeded.',
        code: 429,
        type: 'rate_limit',
        technicalDetails: `Status: 429\nResponse: ${rawMsg}`,
        suggestion: 'Please wait a moment before re-submitting.'
      };
    }

    return {
      message: `NVIDIA error: ${rawMsg}`,
      code: status || 'ERROR',
      type: 'provider_error',
      technicalDetails: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      suggestion: 'Check your NVIDIA key and model selection.'
    };
  }
}
