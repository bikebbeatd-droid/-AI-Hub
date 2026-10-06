import React, { useState } from 'react';
import { 
  Code, 
  Layers, 
  Copy, 
  Check, 
  Download, 
  Eye, 
  FileCode, 
  Sparkles, 
  Trash2, 
  Plus,
  Play
} from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';

export const ArtifactsView: React.FC = () => {
  const { artifacts, activeArtifact, setActiveArtifact, saveArtifact } = useHub();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const selectedArtifact = activeArtifact || artifacts[0] || null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-neutral-50/50 dark:bg-neutral-950 overflow-hidden">
      {/* Artifacts Sidebar */}
      <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-3 flex md:flex-col gap-2 overflow-x-auto shrink-0">
        <div className="hidden md:flex items-center justify-between px-2 py-1">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>Artifact Workspace</span>
          </div>
          <button
            onClick={() => {
              saveArtifact({
                title: `New Code Artifact ${Date.now().toString().slice(-4)}`,
                type: 'code',
                language: 'typescript',
                content: `// AI Generated Artifact\nconsole.log('Ready for execution...');`
              });
            }}
            className="p-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs hover:bg-blue-100 cursor-pointer"
            title="Create new artifact"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex md:flex-col gap-1 w-full overflow-x-auto">
          {artifacts.map(art => {
            const isSelected = selectedArtifact?.id === art.id;

            return (
              <button
                key={art.id}
                onClick={() => setActiveArtifact(art)}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-colors cursor-pointer shrink-0 md:w-full ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 shadow-xs' 
                    : 'border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <FileCode className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {art.title}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase mt-0.5">
                    {art.type} {art.language ? `• ${art.language}` : ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Preview & Code Inspector */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900">
        {selectedArtifact ? (
          <>
            {/* Top Workspace Bar */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>{selectedArtifact.title}</span>
                </h2>

                <div className="flex bg-neutral-200/80 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activeTab === 'preview' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold' : 'text-neutral-500'
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activeTab === 'code' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold' : 'text-neutral-500'
                    }`}
                  >
                    Code &amp; Source
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(selectedArtifact.content)}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Copy</span>
                </button>

                <button
                  onClick={() => handleDownload(`${selectedArtifact.title.replace(/\s+/g, '_')}.${selectedArtifact.language || 'txt'}`, selectedArtifact.content)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download File</span>
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {activeTab === 'preview' ? (
                selectedArtifact.type === 'html' || selectedArtifact.type === 'svg' ? (
                  <div className="w-full h-full min-h-[400px] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white">
                    <iframe 
                      title={selectedArtifact.title}
                      srcDoc={selectedArtifact.content}
                      className="w-full h-full min-h-[400px] border-0"
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs leading-relaxed">
                    <MarkdownRenderer content={selectedArtifact.content} />
                  </div>
                )
              ) : (
                <pre className="p-4 rounded-xl bg-neutral-950 text-neutral-100 font-mono text-xs overflow-x-auto leading-relaxed border border-neutral-800">
                  <code>{selectedArtifact.content}</code>
                </pre>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8 text-center">
            <Layers className="w-8 h-8 mb-2 opacity-50" />
            <div className="font-semibold text-sm">No Artifact Selected</div>
            <div className="text-xs mt-1">Select an artifact from the list or generate one via AI Chat.</div>
          </div>
        )}
      </div>
    </div>
  );
};
