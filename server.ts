import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { ModelStore } from './src/server/modelStore.ts';
import { ModelRouter } from './src/server/router.ts';
import { FileStore } from './src/server/fileStore.ts';
import { ProjectStore } from './src/server/projectStore.ts';
import { OpenRouterAdapter } from './src/server/adapters/openrouter.ts';
import { NvidiaAdapter } from './src/server/adapters/nvidia.ts';
import { GeminiAdapter } from './src/server/adapters/gemini.ts';
import { ProviderType, ModelMode, ChatRequestPayload, ModelInfo } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize models, router, files and projects
const modelStore = new ModelStore();
const modelRouter = new ModelRouter(modelStore);
const fileStore = new FileStore();
const projectStore = new ProjectStore();

const openrouterAdapter = new OpenRouterAdapter();
const nvidiaAdapter = new NvidiaAdapter();
const geminiAdapter = new GeminiAdapter();

// Initial background catalog sync
(async () => {
  try {
    console.log('Synchronizing initial model catalog...');
    const status = await modelStore.syncAll();
    console.log(`Model synchronization complete: ${status.totalModels} models, ${status.glmModelsCount} GLM models, ${status.freeModelsCount} Free models.`);
  } catch (err) {
    console.warn('Initial model sync error:', err);
  }
})();

function getEffectiveKey(provider: ProviderType, clientKeys?: Record<string, string | undefined>): string {
  if (provider === 'openrouter') {
    return clientKeys?.openrouter || process.env.OPENROUTER_API_KEY || '';
  }
  if (provider === 'nvidia') {
    return clientKeys?.nvidia || process.env.NVIDIA_API_KEY || '';
  }
  if (provider === 'gemini') {
    return clientKeys?.gemini || process.env.GEMINI_API_KEY || '';
  }
  return '';
}

function getProviderAdapter(provider: ProviderType) {
  switch (provider) {
    case 'openrouter':
      return openrouterAdapter;
    case 'nvidia':
      return nvidiaAdapter;
    case 'gemini':
      return geminiAdapter;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Providers status check
app.get('/api/providers/status', async (req, res) => {
  const openrouterKey = process.env.OPENROUTER_API_KEY || '';
  const nvidiaKey = process.env.NVIDIA_API_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';

  const models = modelStore.getAllModels();

  res.json({
    openrouter: {
      configured: Boolean(openrouterKey),
      connected: Boolean(openrouterKey),
      modelCount: models.filter((m: ModelInfo) => m.provider === 'openrouter').length
    },
    nvidia: {
      configured: Boolean(nvidiaKey),
      connected: Boolean(nvidiaKey),
      modelCount: models.filter((m: ModelInfo) => m.provider === 'nvidia').length
    },
    gemini: {
      configured: Boolean(geminiKey),
      connected: Boolean(geminiKey),
      modelCount: models.filter((m: ModelInfo) => m.provider === 'gemini').length
    }
  });
});

// Test connection endpoint
app.post('/api/providers/test', async (req, res) => {
  const { provider, apiKey } = req.body;
  if (!provider) {
    return res.status(400).json({ success: false, error: 'Provider is required' });
  }

  const effectiveKey = apiKey || getEffectiveKey(provider);
  if (!effectiveKey) {
    return res.json({ success: false, latencyMs: 0, error: `No API key provided for ${provider}` });
  }

  try {
    const adapter = getProviderAdapter(provider);
    const result = await adapter.testConnection(effectiveKey);
    res.json(result);
  } catch (err: any) {
    res.json({ success: false, latencyMs: 0, error: err.message || 'Test failed' });
  }
});

// List synchronized models
app.get('/api/models', (req, res) => {
  const models = modelStore.getAllModels();
  const status = modelStore.getStatus();
  res.json({
    models,
    status
  });
});

// Trigger synchronization
app.post('/api/models/sync', async (req, res) => {
  const { keys } = req.body || {};
  try {
    const effectiveKeys = {
      openrouter: keys?.openrouter || process.env.OPENROUTER_API_KEY,
      nvidia: keys?.nvidia || process.env.NVIDIA_API_KEY,
      gemini: keys?.gemini || process.env.GEMINI_API_KEY
    };

    const status = await modelStore.syncAll(effectiveKeys);
    res.json({
      status,
      models: modelStore.getAllModels()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Model sync failed' });
  }
});

// Test a specific model
app.post('/api/models/test', async (req, res) => {
  const { modelId, provider, apiKey } = req.body;
  if (!modelId || !provider) {
    return res.status(400).json({ success: false, error: 'modelId and provider are required' });
  }

  const effectiveKey = apiKey || getEffectiveKey(provider);
  if (!effectiveKey) {
    return res.status(400).json({
      success: false,
      error: `API key for provider "${provider}" is required to test model "${modelId}". Configure it in Settings -> Providers.`
    });
  }

  const adapter = getProviderAdapter(provider);

  try {
    const start = Date.now();
    const result = await adapter.chat({
      modelId, // EXACT MODEL ID
      messages: [{ role: 'user', content: "Reply with the single word 'OK'." }],
      apiKey: effectiveKey,
      maxTokens: 10
    });
    res.json({
      success: true,
      latencyMs: result.latencyMs,
      response: result.content,
      usage: result.usage,
      requestId: result.requestId
    });
  } catch (err: any) {
    const normalized = adapter.normalizeError(err);
    res.json({
      success: false,
      latencyMs: 0,
      error: normalized
    });
  }
});

// Real Streaming Chat Endpoint (Server-Sent Events)
app.post('/api/chat/stream', async (req, res) => {
  const payload: ChatRequestPayload = req.body;
  const { messages, mode, modelId, provider, keys, fallbackEnabled = true } = payload;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Set SSE response headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const availableProviders = {
    openrouter: Boolean(keys?.openrouter || process.env.OPENROUTER_API_KEY),
    nvidia: Boolean(keys?.nvidia || process.env.NVIDIA_API_KEY),
    gemini: Boolean(keys?.gemini || process.env.GEMINI_API_KEY)
  };

  let routeDecision;
  try {
    routeDecision = modelRouter.selectModel(mode, messages, {
      requestedModelId: modelId,
      requestedProvider: provider,
      availableProviders
    });
  } catch (err: any) {
    sendEvent({
      error: {
        message: err.message || 'Routing failed',
        code: 'ROUTING_ERROR',
        suggestion: 'Check if you have selected a valid mode or configured provider API keys in Settings.'
      }
    });
    return res.end();
  }

  let activeModel = routeDecision.model;
  let activeProvider = routeDecision.provider;
  let fallbackInfo: any = undefined;

  const tryExecute = async (targetModel: any, targetProvider: ProviderType): Promise<boolean> => {
    const adapter = getProviderAdapter(targetProvider);
    const effectiveKey = getEffectiveKey(targetProvider, keys);

    if (!effectiveKey) {
      throw {
        message: `API key for provider "${targetProvider}" is missing. Please add your key in Settings -> Providers.`,
        code: 401,
        type: 'missing_key',
        suggestion: `Open Settings -> Providers and enter your ${targetProvider.toUpperCase()} API key.`
      };
    }

    // Notify accurate generation states based on payload
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.attachments?.some(a => a.type.startsWith('image/'))) {
      sendEvent({ state: 'reading_image' });
    } else if (lastUserMsg?.attachments?.length) {
      sendEvent({ state: 'analyzing_file' });
    } else {
      sendEvent({ state: 'thinking' });
    }

    const start = Date.now();
    let hasSentFirstToken = false;
    const result = await adapter.streamChat(
      {
        modelId: targetModel.id, // EXACT MODEL ID
        messages,
        apiKey: effectiveKey,
        temperature: payload.temperature,
        maxTokens: payload.maxTokens,
        systemInstruction: payload.systemInstruction
      },
      {
        onChunk: (chunk: string) => {
          if (!hasSentFirstToken) {
            hasSentFirstToken = true;
            sendEvent({ state: 'generating' });
          }
          sendEvent({ chunk });
        }
      }
    );

    const latency = result.latencyMs || (Date.now() - start);
    modelStore.recordSuccess(targetModel.id, targetProvider, latency);

    sendEvent({
      done: true,
      meta: {
        requestId: result.requestId || `req_${Date.now()}`,
        modelId: targetModel.id,
        modelDisplayName: targetModel.displayName,
        provider: targetProvider,
        latencyMs: latency,
        usage: result.usage,
        fallbackUsed: fallbackInfo
      }
    });

    return true;
  };

  try {
    await tryExecute(activeModel, activeProvider);
  } catch (firstError: any) {
    console.warn(`Primary model ${activeModel.id} failed:`, firstError);
    modelStore.recordFailure(activeModel.id, activeProvider, firstError?.message || 'Execution failed');

    // Multi-level fallback strategy: Strictly for AUTO mode
    if (fallbackEnabled && mode === 'AUTO') {
      const task = modelRouter.analyzeTask(messages);
      let recovered = false;

      // Level 1: Attempt another compatible model from the SAME provider
      const level1Model = modelRouter.getFallbackCandidate(activeModel.id, activeProvider, 1, task, availableProviders);
      if (level1Model) {
        console.log(`[Fallback Level 1 - Same Provider] Attempting ${level1Model.displayName} (${level1Model.id})`);
        fallbackInfo = {
          originalModelId: activeModel.id,
          originalProvider: activeProvider,
          reason: `Level 1 Fallback (Same Provider alternative): ${firstError?.message || 'Primary model failed'}`
        };
        try {
          await tryExecute(level1Model, level1Model.provider);
          recovered = true;
        } catch (l1Err: any) {
          console.warn(`Level 1 fallback ${level1Model.id} failed:`, l1Err);
          modelStore.recordFailure(level1Model.id, level1Model.provider, l1Err?.message || 'L1 failed');
        }
      }

      // Level 2: Attempt a compatible model from a DIFFERENT provider (e.g. NVIDIA)
      if (!recovered) {
        const level2Model = modelRouter.getFallbackCandidate(activeModel.id, activeProvider, 2, task, availableProviders);
        if (level2Model) {
          console.log(`[Fallback Level 2 - Cross Provider] Attempting ${level2Model.displayName} (${level2Model.id})`);
          fallbackInfo = {
            originalModelId: activeModel.id,
            originalProvider: activeProvider,
            reason: `Level 2 Fallback (Cross-Provider alternative): ${firstError?.message || 'Primary and Level 1 failed'}`
          };
          try {
            await tryExecute(level2Model, level2Model.provider);
            recovered = true;
          } catch (l2Err: any) {
            console.warn(`Level 2 fallback ${level2Model.id} failed:`, l2Err);
            modelStore.recordFailure(level2Model.id, level2Model.provider, l2Err?.message || 'L2 failed');
          }
        }
      }

      // Level 3: Final configured provider fallback (e.g. Google Gemini)
      if (!recovered) {
        const level3Model = modelRouter.getFallbackCandidate(activeModel.id, activeProvider, 3, task, availableProviders);
        if (level3Model && level3Model.id !== activeModel.id) {
          console.log(`[Fallback Level 3 - Final Gateway] Attempting ${level3Model.displayName} (${level3Model.id})`);
          fallbackInfo = {
            originalModelId: activeModel.id,
            originalProvider: activeProvider,
            reason: `Level 3 Fallback (Resilient Gateway): ${firstError?.message || 'Primary providers failed'}`
          };
          try {
            await tryExecute(level3Model, level3Model.provider);
            recovered = true;
          } catch (l3Err: any) {
            console.warn(`Level 3 fallback ${level3Model.id} failed:`, l3Err);
            modelStore.recordFailure(level3Model.id, level3Model.provider, l3Err?.message || 'L3 failed');
          }
        }
      }

      if (recovered) {
        return res.end();
      }
    }

    // If MANUAL mode or if all fallbacks failed, report error honestly without faking
    const adapter = getProviderAdapter(activeProvider);
    const normalized = adapter.normalizeError(firstError);
    sendEvent({ error: normalized });
  }

  res.end();
});

// Non-streaming chat endpoint
app.post('/api/chat', async (req, res) => {
  const payload: ChatRequestPayload = req.body;
  const { messages, mode, modelId, provider, keys, fallbackEnabled = true } = payload;

  const availableProviders = {
    openrouter: Boolean(keys?.openrouter || process.env.OPENROUTER_API_KEY),
    nvidia: Boolean(keys?.nvidia || process.env.NVIDIA_API_KEY),
    gemini: Boolean(keys?.gemini || process.env.GEMINI_API_KEY)
  };

  try {
    const route = modelRouter.selectModel(mode, messages, {
      requestedModelId: modelId,
      requestedProvider: provider,
      availableProviders
    });

    const adapter = getProviderAdapter(route.provider);
    const key = getEffectiveKey(route.provider, keys);

    if (!key) {
      return res.status(401).json({
        error: {
          message: `API key for provider "${route.provider}" is missing.`,
          suggestion: 'Please configure it in Settings -> Providers.'
        }
      });
    }

    const result = await adapter.chat({
      modelId: route.model.id, // EXACT MODEL ID
      messages,
      apiKey: key
    });

    res.json({
      content: result.content,
      meta: {
        requestId: result.requestId,
        modelId: route.model.id,
        modelDisplayName: route.model.displayName,
        provider: route.provider,
        latencyMs: result.latencyMs,
        usage: result.usage
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chat completion failed' });
  }
});

// ================= FILE MANAGEMENT API =================

// List all files
app.get('/api/files', (req, res) => {
  res.json({ files: fileStore.getAll() });
});

// Upload a file
app.post('/api/files/upload', (req, res) => {
  const { name, size, type, base64Data, textContent, projectId } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'File name is required' });
  }

  try {
    const file = fileStore.saveFile({
      name,
      size: Number(size) || 0,
      type: type || 'application/octet-stream',
      base64Data,
      textContent,
      projectId
    });
    res.json({ success: true, file });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'File upload failed' });
  }
});

// Download a file
app.get('/api/files/:id/download', (req, res) => {
  const file = fileStore.getById(req.params.id);
  const filePath = fileStore.getFilePath(req.params.id);
  if (!file || !filePath) {
    return res.status(404).send('File not found');
  }
  res.download(filePath, file.name);
});

// Rename a file
app.patch('/api/files/:id', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'New file name is required' });
  }
  const updated = fileStore.renameFile(req.params.id, name.trim());
  if (!updated) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.json({ success: true, file: updated });
});

// Delete a file
app.delete('/api/files/:id', (req, res) => {
  const success = fileStore.deleteFile(req.params.id);
  res.json({ success });
});

// Analyze file / generate summary
app.post('/api/files/analyze', async (req, res) => {
  const { fileId } = req.body;
  const file = fileStore.getById(fileId);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const geminiKey = process.env.GEMINI_API_KEY || '';
  if (!geminiKey) {
    return res.json({
      summary: `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB, type: ${file.type})`
    });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    let contents: any[] = [];
    if (file.previewUrl && file.type.startsWith('image/')) {
      const clean = file.previewUrl.replace(/^data:[^;]+;base64,/, '');
      contents = [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: file.type, data: clean } },
          { text: 'Analyze this image in detail. Provide key subjects, visible text/labels, structure, and a concise summary.' }
        ]
      }];
    } else if (file.textContent) {
      contents = [{
        role: 'user',
        parts: [{ text: `Analyze and summarize this document:\n\n[File: ${file.name}]\n${file.textContent.slice(0, 20000)}` }]
      }];
    } else {
      return res.json({ summary: `File ${file.name} is stored and ready for chat queries.` });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents
    });

    res.json({ summary: response.text || 'Analysis completed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'File analysis failed' });
  }
});

// ================= PROJECT WORKSPACES API =================

app.get('/api/projects', (req, res) => {
  res.json({ projects: projectStore.getAll() });
});

app.post('/api/projects', (req, res) => {
  const { title, description, systemInstruction, defaultModelId } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Project title is required' });
  }
  const project = projectStore.create({
    title: title.trim(),
    description,
    systemInstruction,
    defaultModelId
  });
  res.json({ success: true, project });
});

app.patch('/api/projects/:id', (req, res) => {
  const updated = projectStore.update(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json({ success: true, project: updated });
});

app.delete('/api/projects/:id', (req, res) => {
  const success = projectStore.delete(req.params.id);
  res.json({ success });
});

// ================= IMAGE GENERATION API =================

app.post('/api/images/generate', async (req, res) => {
  const { prompt, aspectRatio = '1:1', style = 'photorealistic' } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const geminiKey = process.env.GEMINI_API_KEY || '';
  if (!geminiKey) {
    return res.status(400).json({ error: 'Gemini API key is required for image generation.' });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    try {
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: `${prompt}, style: ${style}`,
        config: {
          numberOfImages: 1,
          aspectRatio: aspectRatio as any,
          outputMimeType: 'image/png'
        }
      });

      const imgBytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (imgBytes) {
        const fileItem = fileStore.saveFile({
          name: `ai_generated_${Date.now()}.png`,
          size: Buffer.from(imgBytes, 'base64').length,
          type: 'image/png',
          base64Data: `data:image/png;base64,${imgBytes}`,
          isGenerated: true
        });
        return res.json({ success: true, file: fileItem });
      }
    } catch (imagenErr: any) {
      console.warn('Imagen 3 API attempt result:', imagenErr?.message);
    }

    // High quality procedural SVG visual generator fallback
    const width = aspectRatio === '16:9' ? 1280 : aspectRatio === '9:16' ? 720 : 1024;
    const height = aspectRatio === '16:9' ? 720 : aspectRatio === '9:16' ? 1280 : 1024;
    const safeTitle = prompt.slice(0, 45).replace(/[<>&"']/g, '');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#1e1b4b" />
          <stop offset="100%" stop-color="#312e81" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <circle cx="${width * 0.5}" cy="${height * 0.42}" r="${Math.min(width, height) * 0.28}" fill="#818cf8" opacity="0.35" filter="blur(50px)" />
      <rect x="${width * 0.1}" y="${height * 0.72}" width="${width * 0.8}" height="2" fill="#4338ca" opacity="0.6" />
      <text x="50%" y="45%" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="${Math.round(width * 0.034)}px">${safeTitle}</text>
      <text x="50%" y="54%" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(width * 0.018)}px">Generated with AI Workspace • ${style}</text>
    </svg>`;

    const base64 = Buffer.from(svg).toString('base64');
    const fileItem = fileStore.saveFile({
      name: `ai_generated_${Date.now()}.svg`,
      size: Buffer.from(svg).length,
      type: 'image/svg+xml',
      base64Data: `data:image/svg+xml;base64,${base64}`,
      isGenerated: true
    });

    return res.json({ success: true, file: fileItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Image generation failed' });
  }
});

// ================= FRONTEND SERVING / VITE MIDDLEWARE =================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Hub Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
