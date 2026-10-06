import React, { useState } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  Code, 
  Film, 
  Table, 
  ArrowRight, 
  Check, 
  Copy, 
  Download, 
  MessageSquare,
  RefreshCw,
  Sliders,
  Layers
} from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';
import { FileItem } from '../types/index.ts';

export const AIToolsView: React.FC = () => {
  const { 
    generateImage, 
    isGeneratingImage, 
    sendMessage, 
    createNewChat, 
    attachFileToCurrentChat 
  } = useHub();

  const [activeTool, setActiveTool] = useState<'image' | 'summarize' | 'video_script' | 'data_convert'>('image');

  // Image Tool State
  const [imagePrompt, setImagePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [imageStyle, setImageStyle] = useState('Photorealistic cinematic lighting, ultra-detailed');
  const [generatedFile, setGeneratedFile] = useState<FileItem | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Script & Text Tool State
  const [toolInput, setToolInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;
    setImageError(null);
    try {
      const file = await generateImage(imagePrompt.trim(), aspectRatio, imageStyle);
      setGeneratedFile(file);
    } catch (err: any) {
      setImageError(err.message || 'Image generation failed');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInChat = (prompt: string) => {
    createNewChat('AUTO');
    sendMessage(prompt);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 backdrop-blur-xs">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <span>AI Tools Suite</span>
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
          Specialized task accelerators for generative imagery, structured documents, code audits, and media scripts.
        </p>
      </div>

      {/* Tool Tabs Bar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/40 flex items-center gap-2 overflow-x-auto text-xs sm:text-sm">
        <button
          onClick={() => setActiveTool('image')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
            activeTool === 'image'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>AI Image Studio</span>
        </button>

        <button
          onClick={() => setActiveTool('summarize')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
            activeTool === 'summarize'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Document Summarizer</span>
        </button>

        <button
          onClick={() => setActiveTool('video_script')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
            activeTool === 'video_script'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Video Script &amp; Storyboard</span>
        </button>

        <button
          onClick={() => setActiveTool('data_convert')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
            activeTool === 'data_convert'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>Table &amp; Data Formatter</span>
        </button>
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full">
        {activeTool === 'image' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                <span>Text-to-Image Generation</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Visual Prompt
                </label>
                <textarea 
                  rows={3}
                  value={imagePrompt}
                  onChange={e => setImagePrompt(e.target.value)}
                  placeholder="e.g. A futuristic glass workstation with holographic displays overlooking a neon cyberpunk city at night, 8k resolution..."
                  className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm text-neutral-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['1:1', '16:9', '9:16', '4:3'] as const).map(ratio => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-1.5 text-xs font-mono font-medium rounded-lg border cursor-pointer transition-colors ${
                          aspectRatio === ratio
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Preset Aesthetic Style
                  </label>
                  <select
                    value={imageStyle}
                    onChange={e => setImageStyle(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Photorealistic cinematic lighting, ultra-detailed">Photorealistic Cinematic</option>
                    <option value="Digital concept art, vibrant neon palette">Digital Concept Art</option>
                    <option value="Minimalist vector illustration, clean lines">Minimalist Vector</option>
                    <option value="3D Pixar-style octane render, soft shading">3D Octane Render</option>
                    <option value="Dark moody cyberpunk aesthetic">Cyberpunk Synthwave</option>
                  </select>
                </div>
              </div>

              {imageError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs">
                  {imageError}
                </div>
              )}

              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isGeneratingImage ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing visual asset...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate High-Fidelity Image</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Image Result Card */}
            {generatedFile && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Generated Result
                  </h3>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Saved to Files Workspace
                  </span>
                </div>

                <div className="rounded-xl overflow-hidden bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center max-h-[480px]">
                  {generatedFile.previewUrl && (
                    <img 
                      src={generatedFile.previewUrl} 
                      alt="Generated AI Visual"
                      className="max-h-[480px] w-auto object-contain"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <span className="text-xs text-neutral-500 font-mono">
                    {generatedFile.name}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => attachFileToCurrentChat(generatedFile)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask AI in Chat</span>
                    </button>
                    <a
                      href={generatedFile.url}
                      download={generatedFile.name}
                      className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-xs font-medium flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTool === 'summarize' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Document &amp; Code Summarizer</span>
            </h2>
            <p className="text-xs text-neutral-500">
              Paste articles, research notes, meeting transcripts, or code to extract key takeaways, action items, or refactoring ideas.
            </p>

            <textarea 
              rows={6}
              value={toolInput}
              onChange={e => setToolInput(e.target.value)}
              placeholder="Paste text, article or code block here..."
              className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm text-neutral-900 dark:text-white outline-none focus:border-blue-500 transition-colors font-mono"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleOpenInChat(`Please summarize the following content into 5 bullet points with executive takeaways:\n\n${toolInput}`)}
                disabled={!toolInput.trim()}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-left transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="font-semibold text-xs text-neutral-900 dark:text-white">Executive Summary</div>
                <div className="text-[11px] text-neutral-500 mt-1">Key findings &amp; bullet takeaways</div>
              </button>

              <button
                onClick={() => handleOpenInChat(`Please analyze this code, explain its architecture, identify potential bottlenecks, and provide an optimized refactored version:\n\n${toolInput}`)}
                disabled={!toolInput.trim()}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-left transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="font-semibold text-xs text-neutral-900 dark:text-white">Code Audit &amp; Refactor</div>
                <div className="text-[11px] text-neutral-500 mt-1">Security check &amp; clean code rewrite</div>
              </button>

              <button
                onClick={() => handleOpenInChat(`Extract all actionable tasks, deadlines, and responsibilities mentioned in this text:\n\n${toolInput}`)}
                disabled={!toolInput.trim()}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-left transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="font-semibold text-xs text-neutral-900 dark:text-white">Action Items &amp; Tasks</div>
                <div className="text-[11px] text-neutral-500 mt-1">Structured checklists &amp; deadlines</div>
              </button>
            </div>
          </div>
        )}

        {activeTool === 'video_script' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-500" />
              <span>Video Script &amp; Storyboard Planner</span>
            </h2>
            <p className="text-xs text-neutral-500">
              Generate structured video production scripts, scene-by-scene timing, voiceover narration, B-roll suggestions, and visual prompts for YouTube, Shorts, or product demos.
            </p>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Video Topic &amp; Format
              </label>
              <input 
                type="text"
                value={toolInput}
                onChange={e => setToolInput(e.target.value)}
                placeholder="e.g. 60-second viral Short explaining how quantum computing works..."
                className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm text-neutral-900 dark:text-white outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleOpenInChat(`Create a structured 60-second video script and storyboard for: "${toolInput || 'Explain a complex tech concept'}". Include exact timestamped segments (0:00-0:10 Hook, 0:10-0:40 Core message, 0:40-1:00 Call to action), narration lines, on-screen text graphics, and suggested B-roll visuals.`)}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-xs text-neutral-900 dark:text-white">Short-Form Script (60s Short / Reel)</div>
                <div className="text-[11px] text-neutral-500 mt-1">High-retention hook, fast pacing, visual callouts</div>
              </button>

              <button
                onClick={() => handleOpenInChat(`Create a complete production storyboard and full video script for: "${toolInput || 'Product launch video'}". Structure into Table format with Scene #, Duration, Visual Cue, Narration, and Sound Effects.`)}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-xs text-neutral-900 dark:text-white">Full Storyboard Table</div>
                <div className="text-[11px] text-neutral-500 mt-1">Timestamped table with audio, video cues, and graphics</div>
              </button>
            </div>
          </div>
        )}

        {activeTool === 'data_convert' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-500" />
              <span>Table &amp; Data Converter</span>
            </h2>
            <p className="text-xs text-neutral-500">
              Transform unstructured text, pasted spreadsheets, or JSON objects into clean Markdown tables, CSV exports, or structured schemas.
            </p>

            <textarea 
              rows={5}
              value={toolInput}
              onChange={e => setToolInput(e.target.value)}
              placeholder="Paste raw unstructured data, log lines, or text here..."
              className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm text-neutral-900 dark:text-white outline-none focus:border-emerald-500 transition-colors font-mono"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleOpenInChat(`Convert the following raw data into a clean, properly formatted Markdown table with headers and aligned columns:\n\n${toolInput}`)}
                disabled={!toolInput.trim()}
                className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-left transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="font-semibold text-xs text-neutral-900 dark:text-white">Convert to Markdown Table</div>
                <div className="text-[11px] text-neutral-500 mt-1">Clean grid with headers and sorted columns</div>
              </button>

              <button
                onClick={() => handleOpenInChat(`Convert the following text/data into strict JSON format with typed schema and validation:\n\n${toolInput}`)}
                disabled={!toolInput.trim()}
                className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-left transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="font-semibold text-xs text-neutral-900 dark:text-white">Convert to JSON Object</div>
                <div className="text-[11px] text-neutral-500 mt-1">Strict JSON code block with syntax validation</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
