import React, { useState } from 'react';
import { 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  RefreshCw, 
  Trash2, 
  ShieldCheck,
  Server,
  Zap,
  Sliders,
  Settings,
  Palette,
  Bot,
  HardDrive,
  MessageSquare,
  Lock,
  Info,
  Download,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';
import { ProviderType } from '../types/index.ts';
import * as api from '../services/api.ts';

type SettingsTab = 
  | 'general' 
  | 'appearance' 
  | 'ai' 
  | 'api' 
  | 'files' 
  | 'chat' 
  | 'privacy' 
  | 'about';

export const SettingsView: React.FC = () => {
  const {
    providerKeys,
    setProviderKey,
    providerStatus,
    testProvider,
    refreshModels,
    syncStatus,
    theme,
    setTheme,
    settings,
    updateSettings,
    clearAllConversations,
    conversations,
    files
  } = useHub();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const [showKey, setShowKey] = useState<{ openrouter: boolean; nvidia: boolean; gemini: boolean }>({
    openrouter: false,
    nvidia: false,
    gemini: false
  });

  const [testing, setTesting] = useState<{ openrouter: boolean; nvidia: boolean; gemini: boolean }>({
    openrouter: false,
    nvidia: false,
    gemini: false
  });

  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latencyMs: number; error?: string }>>({});

  const handleTest = async (provider: ProviderType) => {
    setTesting(prev => ({ ...prev, [provider]: true }));
    try {
      const res = await testProvider(provider);
      setTestResults(prev => ({ ...prev, [provider]: res }));
      if (res.success) {
        refreshModels();
      }
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleExportData = () => {
    const data = {
      conversations,
      filesCount: files.length,
      settings,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_hub_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-neutral-50/50 dark:bg-neutral-950 overflow-hidden">
      {/* Settings Navigation Sidebar */}
      <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-3 flex md:flex-col gap-1 overflow-x-auto shrink-0">
        <div className="hidden md:block px-3 py-2 text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
          Workspace Settings
        </div>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'general'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'appearance'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Appearance</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'ai'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI &amp; Models</span>
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'api'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Configuration</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'files'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Files</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'chat'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'privacy'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Privacy</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'about'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>About</span>
        </button>
      </div>

      {/* Settings Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">General Preferences</h2>
                <p className="text-xs text-neutral-500">Configure default routing modes and message interactions.</p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Auto-Scroll to Bottom</div>
                    <div className="text-[11px] text-neutral-500">Automatically scroll viewport as new tokens stream in.</div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.general.autoScroll}
                    onChange={e => updateSettings({ general: { ...settings.general, autoScroll: e.target.checked } })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Send on Enter</div>
                    <div className="text-[11px] text-neutral-500">Press Enter to send (Shift + Enter for new line).</div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.general.sendOnEnter}
                    onChange={e => updateSettings({ general: { ...settings.general, sendOnEnter: e.target.checked } })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Appearance &amp; Theme</h2>
                <p className="text-xs text-neutral-500">Customize the visual theme, contrast, and layout styling.</p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-2">Color Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                        theme === 'light'
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                        theme === 'dark'
                          ? 'border-blue-500 bg-blue-950/60 text-blue-400 font-semibold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      <span>Dark</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('system')}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                        theme === 'system'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Laptop className="w-4 h-4" />
                      <span>System</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-2">Chat Bubble Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['bordered', 'minimal', 'card'] as const).map(style => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => updateSettings({ appearance: { ...settings.appearance, bubbleStyle: style } })}
                        className={`p-2 rounded-lg border text-xs font-medium capitalize cursor-pointer transition-colors ${
                          settings.appearance.bubbleStyle === style
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI & MODELS */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">AI Inference &amp; Models</h2>
                <p className="text-xs text-neutral-500">Fine-tune temperature, token limits, and reasoning indicator.</p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-900 dark:text-white">
                      Temperature ({settings.ai.temperature})
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      {settings.ai.temperature < 0.4 ? 'Focused & Deterministic' : settings.ai.temperature > 0.8 ? 'Creative & Exploratory' : 'Balanced'}
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={settings.ai.temperature}
                    onChange={e => updateSettings({ ai: { ...settings.ai, temperature: parseFloat(e.target.value) } })}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-900 dark:text-white">
                      Maximum Output Tokens ({settings.ai.maxOutputTokens})
                    </label>
                    <span className="text-[11px] text-neutral-400">Up to 8,192 tokens</span>
                  </div>
                  <input 
                    type="range"
                    min="512"
                    max="8192"
                    step="256"
                    value={settings.ai.maxOutputTokens}
                    onChange={e => updateSettings({ ai: { ...settings.ai, maxOutputTokens: parseInt(e.target.value) } })}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Reasoning &amp; Thinking Indicator</div>
                    <div className="text-[11px] text-neutral-500">Show step-by-step thinking pill before streaming response.</div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.ai.enableThinking}
                    onChange={e => updateSettings({ ai: { ...settings.ai, enableThinking: e.target.checked } })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Multi-Level Resilient Fallback</div>
                    <div className="text-[11px] text-neutral-500">In AUTO mode, automatically recover if a provider is overloaded.</div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.ai.fallbackEnabled}
                    onChange={e => updateSettings({ ai: { ...settings.ai, fallbackEnabled: e.target.checked } })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* API CONFIGURATION */}
          {activeTab === 'api' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Provider Credentials</h2>
                  <p className="text-xs text-neutral-500">Configure API keys for OpenRouter, NVIDIA NIM, and Gemini.</p>
                </div>
                <button
                  onClick={() => refreshModels()}
                  disabled={syncStatus.isSyncing}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Catalog</span>
                </button>
              </div>

              {/* OpenRouter */}
              <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900 dark:text-white">OpenRouter</span>
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                      Get Key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${providerStatus.openrouter.connected ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                    {providerStatus.openrouter.connected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type={showKey.openrouter ? 'text' : 'password'}
                    value={providerKeys.openrouter}
                    onChange={e => setProviderKey('openrouter', e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono text-xs text-neutral-900 dark:text-white outline-none"
                  />
                  <button onClick={() => setShowKey(p => ({ ...p, openrouter: !p.openrouter }))} className="p-2 border rounded-lg text-neutral-500">
                    {showKey.openrouter ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => handleTest('openrouter')} 
                    disabled={testing.openrouter}
                    className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {testing.openrouter ? 'Testing...' : 'Test'}
                  </button>
                </div>
                {testResults.openrouter && (
                  <div className={`text-xs ${testResults.openrouter.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {testResults.openrouter.success ? `Latency: ${testResults.openrouter.latencyMs}ms` : testResults.openrouter.error}
                  </div>
                )}
              </div>

              {/* NVIDIA NIM */}
              <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900 dark:text-white">NVIDIA NIM</span>
                    <a href="https://build.nvidia.com" target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                      Get Key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${providerStatus.nvidia.connected ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                    {providerStatus.nvidia.connected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type={showKey.nvidia ? 'text' : 'password'}
                    value={providerKeys.nvidia}
                    onChange={e => setProviderKey('nvidia', e.target.value)}
                    placeholder="nvapi-..."
                    className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono text-xs text-neutral-900 dark:text-white outline-none"
                  />
                  <button onClick={() => setShowKey(p => ({ ...p, nvidia: !p.nvidia }))} className="p-2 border rounded-lg text-neutral-500">
                    {showKey.nvidia ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => handleTest('nvidia')} 
                    disabled={testing.nvidia}
                    className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {testing.nvidia ? 'Testing...' : 'Test'}
                  </button>
                </div>
                {testResults.nvidia && (
                  <div className={`text-xs ${testResults.nvidia.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {testResults.nvidia.success ? `Latency: ${testResults.nvidia.latencyMs}ms` : testResults.nvidia.error}
                  </div>
                )}
              </div>

              {/* Gemini */}
              <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900 dark:text-white">Google Gemini</span>
                    <span className="text-[11px] text-neutral-400">(Built-in / Server-configured)</span>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    Active
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  Google Gemini models are configured natively with server credentials. You can optionally supply your own custom Gemini key if desired.
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type={showKey.gemini ? 'text' : 'password'}
                    value={providerKeys.gemini}
                    onChange={e => setProviderKey('gemini', e.target.value)}
                    placeholder="AIzaSy... (optional override)"
                    className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono text-xs text-neutral-900 dark:text-white outline-none"
                  />
                  <button onClick={() => setShowKey(p => ({ ...p, gemini: !p.gemini }))} className="p-2 border rounded-lg text-neutral-500">
                    {showKey.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => handleTest('gemini')} 
                    disabled={testing.gemini}
                    className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {testing.gemini ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FILES */}
          {activeTab === 'files' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Files &amp; Attachments</h2>
                <p className="text-xs text-neutral-500">Manage file storage limits and document reading preferences.</p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Total Files Stored</div>
                    <div className="text-[11px] text-neutral-500">{files.length} active documents &amp; images in workspace.</div>
                  </div>
                  <span className="font-mono text-xs text-neutral-500 font-semibold">{files.length}</span>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Auto-Summarize Uploads</div>
                    <div className="text-[11px] text-neutral-500">Generate executive summary card when files are inspected.</div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.files.autoSummarize}
                    onChange={e => updateSettings({ files: { ...settings.files, autoSummarize: e.target.checked } })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Maximum File Upload Limit</div>
                    <div className="text-[11px] text-neutral-500">Configured up to 50 MB per file.</div>
                  </div>
                  <span className="font-mono text-xs text-neutral-500 font-semibold">50 MB</span>
                </div>
              </div>
            </div>
          )}

          {/* CHAT SETTINGS */}
          {activeTab === 'chat' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Chat &amp; System Instruction</h2>
                <p className="text-xs text-neutral-500">Set the default AI persona and response formatting.</p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
                    Default System Instruction
                  </label>
                  <textarea 
                    rows={4}
                    value={settings.chat.systemInstruction}
                    onChange={e => updateSettings({ chat: { ...settings.chat, systemInstruction: e.target.value } })}
                    placeholder="e.g. You are a senior software architect and scientific researcher. Explain concepts clearly with code examples and math proofs..."
                    className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm text-neutral-900 dark:text-white outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Mathematical LaTeX Rendering</div>
                    <div className="text-[11px] text-neutral-500">Parse inline $...$ and block $$...$$ expressions.</div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.chat.renderMarkdownMath}
                    onChange={e => updateSettings({ chat: { ...settings.chat, renderMarkdownMath: e.target.checked } })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY & DATA CONTROL */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Privacy &amp; Data Control</h2>
                <p className="text-xs text-neutral-500">Manage data persistence, file storage lifecycle, and workspace memory.</p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Save History in Local Storage</div>
                    <div className="text-[11px] text-neutral-500">Persist conversations across browser reloads.</div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.privacy.saveHistoryLocally}
                    onChange={e => updateSettings({ privacy: { ...settings.privacy, saveHistoryLocally: e.target.checked } })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Export Workspace Backup</div>
                    <div className="text-[11px] text-neutral-500">Download conversation history, file metadata, and settings as JSON.</div>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Clean Orphan Files &amp; Metadata</div>
                    <div className="text-[11px] text-neutral-500">Scan disk storage for unindexed files and repair file store metadata.</div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await api.cleanupOrphanFiles();
                        alert(`Cleanup complete: Repaired ${res.result.cleanedMetadata} metadata entries and ${res.result.cleanedDiskFiles} orphan disk files.`);
                      } catch (e: any) {
                        alert(e.message || 'Cleanup failed');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium cursor-pointer shadow-xs"
                  >
                    Cleanup Storage
                  </button>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-red-600">Delete All Workspace Files</div>
                    <div className="text-[11px] text-neutral-500">Permanently remove all uploaded &amp; generated files from server disk.</div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to permanently delete all stored workspace files from disk?')) {
                        try {
                          const res = await api.deleteAllFiles();
                          alert(`Successfully deleted ${res.count} workspace files.`);
                          window.location.reload();
                        } catch (e: any) {
                          alert(e.message || 'File deletion failed');
                        }
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 hover:bg-red-100 border border-red-200 dark:border-red-900 text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Delete All Files
                  </button>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-red-600">Clear All Chat History</div>
                    <div className="text-[11px] text-neutral-500">Permanently delete all conversation transcripts from browser storage.</div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete all chat history?')) {
                        clearAllConversations();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Clear Chat History
                  </button>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-red-600 font-bold">Reset Workspace &amp; Clear Everything</div>
                    <div className="text-[11px] text-neutral-500">Clear all local storage, files, settings, and cached data.</div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('WARNING: This will permanently wipe all chat history, stored files, and settings. Proceed?')) {
                        try {
                          await api.clearAllPrivacyData();
                          localStorage.clear();
                          alert('Workspace reset complete.');
                          window.location.reload();
                        } catch (e: any) {
                          alert(e.message || 'Reset failed');
                        }
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold cursor-pointer shadow-xs"
                  >
                    Reset Everything
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">About AI Workspace</h2>
                <p className="text-xs text-neutral-500">Unified intelligence platform and technical architecture.</p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                <div className="font-bold text-sm text-neutral-900 dark:text-white">
                  AI Hub &amp; Unified Workspace v2.4.0
                </div>
                <p>
                  A general-purpose AI assistant and multi-model gateway connecting OpenRouter, NVIDIA NIM, and Google Gemini with live model synchronization, multimodal file analysis, and intelligent automated routing.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800">
                    <div className="font-semibold text-neutral-900 dark:text-white mb-0.5">Runtime Model Gateway</div>
                    <div className="text-[11px]">OpenRouter + NVIDIA NIM + Gemini</div>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800">
                    <div className="font-semibold text-neutral-900 dark:text-white mb-0.5">Multimodal Core</div>
                    <div className="text-[11px]">Images, PDFs, Documents, Code, Data</div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-neutral-400">
                  Built with Express, Vite, React 19, TypeScript, and Tailwind CSS.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
