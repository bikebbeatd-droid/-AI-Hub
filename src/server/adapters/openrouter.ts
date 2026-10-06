import { ModelInfo, ChatMessageErrorDetails } from '../../types/index.ts';
import { ProviderAdapter, ChatCompletionParams, StreamCallbacks, CompletionResult } from './base.ts';

export class OpenRouterAdapter implements ProviderAdapter {
  provider = 'openrouter' as const;
  private baseUrl = 'https://openrouter.ai/api/v1';

  async testConnection(apiKey: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, latencyMs: 0, error: 'API key is required' };
    }

    const start = Date.now();
    try {
      // OpenRouter has /auth/key to verify authentication and check credits
      const res = await fetch(`${this.baseUrl}/auth/key`, {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': process.env.APP_URL || 'https://ai-hub.internal',
          'X-Title': 'AI Hub'
        },
        signal: AbortSignal.timeout(10000)
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errorText = await res.text();
        let errMsg = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(errorText);
          errMsg = parsed.error?.message || errMsg;
        } catch {
          errMsg = errorText || errMsg;
        }
        return { success: false, latencyMs, error: errMsg };
      }

      const data = await res.json();
      if (data?.data) {
        return { success: true, latencyMs };
      }
      return { success: true, latencyMs };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return { success: false, latencyMs, error: err.message || 'Connection timed out' };
    }
  }

  async listModels(apiKey?: string): Promise<ModelInfo[]> {
    const headers: Record<string, string> = {
      'HTTP-Referer': process.env.APP_URL || 'https://ai-hub.internal',
      'X-Title': 'AI Hub'
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    const res = await fetch(`${this.baseUrl}/models`, {
      headers,
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch OpenRouter models: HTTP ${res.status}`);
    }

    const json = await res.json();
    const rawList = Array.isArray(json.data) ? json.data : [];

    const now = new Date().toISOString();

    return rawList.map((m: any): ModelInfo => {
      const id = String(m.id || '');
      const name = String(m.name || id);
      const desc = String(m.description || '');

      const promptPrice = parseFloat(m.pricing?.prompt || '0');
      const completionPrice = parseFloat(m.pricing?.completion || '0');
      const isFree = promptPrice === 0 && completionPrice === 0;

      const lowerId = id.toLowerCase();
      const lowerName = name.toLowerCase();
      const lowerDesc = desc.toLowerCase();

      // Precise GLM detection
      const isGlm = lowerId.includes('glm') || 
                    lowerId.includes('zhipu') || 
                    lowerId.includes('thudm') || 
                    lowerId.startsWith('z-ai/') ||
                    lowerName.includes('glm') ||
                    lowerName.includes('zhipu');

      // Coding capabilities
      const supportsCoding = lowerId.includes('code') || 
                             lowerId.includes('coder') || 
                             lowerName.includes('coder') || 
                             lowerDesc.includes('code') || 
                             lowerDesc.includes('programming') ||
                             lowerId.includes('qwen-2.5-coder') ||
                             lowerId.includes('deepseek-coder');

      // Reasoning capabilities
      const supportsReasoning = lowerId.includes('r1') || 
                                lowerId.includes('reasoner') || 
                                lowerId.includes('reasoning') || 
                                lowerId.includes('o1') || 
                                lowerId.includes('o3') || 
                                lowerId.includes('qwq') || 
                                lowerId.includes('thinking') ||
                                lowerDesc.includes('reasoning') ||
                                lowerDesc.includes('chain-of-thought');

      // Vision capabilities
      const modalities = Array.isArray(m.architecture?.modality?.split('->'))
        ? m.architecture.modality.split('->').map((s: string) => s.trim())
        : [];
      const supportsVision = modalities.some((mod: string) => mod.includes('image')) ||
                             lowerId.includes('vision') || 
                             lowerId.includes('vl') || 
                             lowerId.includes('4v') || 
                             lowerId.includes('5v') || 
                             lowerName.includes('vision');

      const tags: string[] = [];
      if (isGlm) tags.push('GLM');
      if (isFree) tags.push('Free');
      if (supportsCoding) tags.push('Coding');
      if (supportsReasoning) tags.push('Reasoning');
      if (supportsVision) tags.push('Vision');

      return {
        id, // EXACT IMMUTABLE PROVIDER ID
        displayName: name,
        provider: 'openrouter',
        ownedBy: m.top_provider?.is_moderated ? 'Moderated' : (id.split('/')[0] || 'OpenRouter'),
        description: desc,
        contextLength: Number(m.context_length) || 4096,
        inputModalities: modalities[0] ? [modalities[0]] : ['text'],
        outputModalities: modalities[1] ? [modalities[1]] : ['text'],
        pricing: {
          prompt: promptPrice,
          completion: completionPrice,
          isFree
        },
        isFree,
        supportsVision,
        supportsReasoning,
        supportsTools: Boolean(m.supported_parameters?.includes('tools')),
        supportsStreaming: true,
        supportsCoding,
        status: 'available',
        lastSynced: now,
        tags,
        isGlm
      };
    });
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
        'HTTP-Referer': process.env.APP_URL || 'https://ai-hub.internal',
        'X-Title': 'AI Hub'
      },
      body: JSON.stringify({
        model: params.modelId, // EXACT MODEL ID
        messages: formattedMessages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 4096
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
      throw { status: res.status, body: parsedError, message: parsedError?.error?.message || errorText };
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
        'HTTP-Referer': process.env.APP_URL || 'https://ai-hub.internal',
        'X-Title': 'AI Hub'
      },
      body: JSON.stringify({
        model: params.modelId, // EXACT MODEL ID
        messages: formattedMessages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 4096,
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
      throw { status: res.status, body: parsedError, message: parsedError?.error?.message || errorText };
    }

    if (!res.body) {
      throw new Error('No response stream available from OpenRouter');
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
          if (!trimmed || trimmed.startsWith(':')) continue; // Skip comments/keepalive

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === '[DONE]') {
              continue;
            }

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
              // Ignore partial JSON chunks
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
    const rawMsg = error?.message || error?.body?.error?.message || (typeof error === 'string' ? error : 'Unknown OpenRouter error');

    if (status === 401 || rawMsg.toLowerCase().includes('api key') || rawMsg.toLowerCase().includes('unauthorized')) {
      return {
        message: 'OpenRouter authentication failed: Invalid or missing API key.',
        code: 401,
        type: 'authentication_error',
        technicalDetails: `Status: ${status || 401}\nResponse: ${rawMsg}`,
        suggestion: 'Please verify your OpenRouter API key in Settings -> Providers.'
      };
    }

    if (status === 402 || rawMsg.toLowerCase().includes('credits') || rawMsg.toLowerCase().includes('payment')) {
      return {
        message: 'OpenRouter credit balance depleted or payment required.',
        code: 402,
        type: 'quota_error',
        technicalDetails: `Status: ${status || 402}\nResponse: ${rawMsg}`,
        suggestion: 'Top up your OpenRouter account or switch to a Free model in the model picker.'
      };
    }

    if (status === 404 || rawMsg.toLowerCase().includes('model not found')) {
      return {
        message: 'Selected model is not currently available on OpenRouter.',
        code: 404,
        type: 'model_not_found',
        technicalDetails: `Status: 404\nResponse: ${rawMsg}`,
        suggestion: 'Refresh the model catalog in the Models tab or select an active model.'
      };
    }

    if (status === 429 || rawMsg.toLowerCase().includes('rate limit')) {
      return {
        message: 'OpenRouter rate limit reached. Model is receiving heavy traffic.',
        code: 429,
        type: 'rate_limit',
        technicalDetails: `Status: 429\nResponse: ${rawMsg}`,
        suggestion: 'Wait a few seconds and try again, or switch to an alternative model.'
      };
    }

    if (status >= 500) {
      return {
        message: 'OpenRouter or upstream model provider is experiencing temporary downtime.',
        code: status,
        type: 'upstream_error',
        technicalDetails: `Status: ${status}\nResponse: ${rawMsg}`,
        suggestion: 'Try again in a few moments or use automatic fallback.'
      };
    }

    return {
      message: `OpenRouter error: ${rawMsg}`,
      code: status || 'ERROR',
      type: 'provider_error',
      technicalDetails: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      suggestion: 'Check your network connection and API key configuration.'
    };
  }
}
