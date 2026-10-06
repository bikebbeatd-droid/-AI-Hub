import { 
  ModelInfo, 
  SyncStatus, 
  ProviderStatusMap, 
  ChatRequestPayload, 
  ChatStreamChunk, 
  ProviderType,
  FileItem,
  ProjectItem,
  GenerationState
} from '../types/index.ts';

export async function fetchHealth(): Promise<{ status: string; uptime: number }> {
  const res = await fetch('/api/health');
  return res.json();
}

export async function fetchProviderStatus(): Promise<ProviderStatusMap> {
  const res = await fetch('/api/providers/status');
  if (!res.ok) throw new Error('Failed to fetch provider status');
  return res.json();
}

export async function testProviderConnection(
  provider: ProviderType, 
  apiKey: string
): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const res = await fetch('/api/providers/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, apiKey })
  });
  return res.json();
}

export async function fetchModels(): Promise<{ models: ModelInfo[]; status: SyncStatus }> {
  const res = await fetch('/api/models');
  if (!res.ok) throw new Error('Failed to fetch models');
  return res.json();
}

export async function syncModels(keys?: { 
  openrouter?: string; 
  nvidia?: string; 
  gemini?: string 
}): Promise<{ models: ModelInfo[]; status: SyncStatus }> {
  const res = await fetch('/api/models/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keys })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to sync models');
  }
  return res.json();
}

export async function testSpecificModel(
  modelId: string, 
  provider: ProviderType, 
  apiKey?: string
): Promise<{ success: boolean; latencyMs: number; response?: string; usage?: any; error?: any }> {
  const res = await fetch('/api/models/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelId, provider, apiKey })
  });
  return res.json();
}

export async function streamChat(
  payload: ChatRequestPayload,
  onChunk: (chunk: string) => void,
  onDone: (meta: NonNullable<ChatStreamChunk['meta']>) => void,
  onError: (error: NonNullable<ChatStreamChunk['error']>) => void,
  onState?: (state: GenerationState) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: abortSignal
  });

  if (!res.ok) {
    const errText = await res.text();
    let parsedErr: any;
    try {
      parsedErr = JSON.parse(errText);
    } catch {
      parsedErr = { message: errText || `HTTP ${res.status}` };
    }
    onError(parsedErr.error || parsedErr);
    return;
  }

  if (!res.body) {
    onError({ message: 'No response body stream received' });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6);
        try {
          const data: any = JSON.parse(jsonStr);
          if (data.state && onState) {
            onState(data.state);
          }
          if (data.chunk) {
            onChunk(data.chunk);
          }
          if (data.done && data.meta) {
            onDone(data.meta);
          }
          if (data.error) {
            onError(data.error);
          }
        } catch {
          // ignore chunk parse issues
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ================= FILE API CLIENT =================

export async function fetchFiles(): Promise<{ files: FileItem[] }> {
  const res = await fetch('/api/files');
  if (!res.ok) throw new Error('Failed to fetch files');
  return res.json();
}

export async function uploadFile(fileData: {
  name: string;
  size: number;
  type: string;
  base64Data?: string;
  textContent?: string;
  projectId?: string;
}): Promise<{ success: boolean; file: FileItem }> {
  const res = await fetch('/api/files/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fileData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload file');
  }
  return res.json();
}

export async function renameFile(id: string, name: string): Promise<{ success: boolean; file: FileItem }> {
  const res = await fetch(`/api/files/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to rename file');
  return res.json();
}

export async function deleteFile(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/files/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete file');
  return res.json();
}

export async function deleteAllFiles(): Promise<{ success: boolean; count: number }> {
  const res = await fetch('/api/files', {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete all files');
  return res.json();
}

export async function cleanupOrphanFiles(): Promise<{ success: boolean; result: any }> {
  const res = await fetch('/api/files/cleanup', {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to cleanup orphan files');
  return res.json();
}

export async function clearAllPrivacyData(): Promise<{ success: boolean; clearedFilesCount: number }> {
  const res = await fetch('/api/privacy/clear-all', {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to clear privacy data on server');
  return res.json();
}

export async function analyzeFile(fileId: string): Promise<{ summary: string }> {
  const res = await fetch('/api/files/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId })
  });
  if (!res.ok) throw new Error('Failed to analyze file');
  return res.json();
}

// ================= PROJECT API CLIENT =================

export async function fetchProjects(): Promise<{ projects: ProjectItem[] }> {
  const res = await fetch('/api/projects');
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function createProject(data: {
  title: string;
  description?: string;
  systemInstruction?: string;
  defaultModelId?: string;
}): Promise<{ success: boolean; project: ProjectItem }> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function updateProject(id: string, updates: Partial<ProjectItem>): Promise<{ success: boolean; project: ProjectItem }> {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update project');
  return res.json();
}

export async function deleteProject(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete project');
  return res.json();
}

// ================= IMAGE GENERATION API CLIENT =================

export async function generateImage(params: {
  prompt: string;
  aspectRatio?: string;
  style?: string;
}): Promise<{ success: boolean; file: FileItem }> {
  const res = await fetch('/api/images/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Image generation failed');
  }
  return res.json();
}

// ================= AUDIO API CLIENT =================

export async function transcribeAudio(audioBase64: string, mimeType?: string): Promise<{ success: boolean; text: string }> {
  const res = await fetch('/api/audio/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64, mimeType })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Speech transcription failed');
  }
  return res.json();
}

export async function generateSpeech(text: string, voice?: string): Promise<{ success: boolean; audioBase64: string; mimeType: string }> {
  const res = await fetch('/api/audio/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Text-to-speech generation failed');
  }
  return res.json();
}
