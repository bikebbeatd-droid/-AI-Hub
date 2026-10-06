import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  FileSpreadsheet, 
  File, 
  Trash2, 
  Download, 
  Edit2, 
  Sparkles, 
  MessageSquare, 
  Search, 
  Check, 
  X, 
  Clock, 
  Eye, 
  AlertCircle,
  HardDrive
} from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';
import { FileItem } from '../types/index.ts';

export const FilesView: React.FC = () => {
  const {
    files,
    isLoadingFiles,
    uploadFile,
    deleteFile,
    renameFile,
    analyzeFile,
    attachFileToCurrentChat
  } = useHub();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'doc' | 'code'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (type: string, ext: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-indigo-500" />;
    if (type.includes('pdf') || ext === 'pdf') return <FileText className="w-5 h-5 text-rose-500" />;
    if (['ts', 'js', 'py', 'html', 'css', 'json'].includes(ext)) return <FileCode className="w-5 h-5 text-emerald-500" />;
    if (['csv', 'xlsx', 'xls'].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-amber-500" />;
    return <File className="w-5 h-5 text-neutral-500" />;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        await uploadFile(uploadedFiles[i]);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      for (let i = 0; i < droppedFiles.length; i++) {
        await uploadFile(droppedFiles[i]);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Drop upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async (id: string) => {
    setAnalyzingId(id);
    try {
      await analyzeFile(id);
    } catch (e: any) {
      alert(e.message || 'Analysis failed');
    } finally {
      setAnalyzingId(null);
    }
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'image') return f.type.startsWith('image/');
    if (filterType === 'doc') return f.type.includes('pdf') || ['txt', 'md', 'doc', 'docx'].includes(f.extension);
    if (filterType === 'code') return ['ts', 'js', 'py', 'json', 'html', 'css'].includes(f.extension);
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950 overflow-hidden">
      {/* Hidden File Input */}
      <input 
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header */}
      <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-500" />
            <span>Files Workspace</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Upload images, PDFs, datasets, and code for multimodal reasoning and assistant analysis.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs sm:text-sm transition-colors shadow-xs cursor-pointer disabled:opacity-50"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{isUploading ? 'Uploading...' : 'Upload Files'}</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs sm:text-sm text-neutral-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
              filterType === 'all' 
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            All ({files.length})
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
              filterType === 'image' 
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setFilterType('doc')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
              filterType === 'doc' 
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Documents & PDFs
          </button>
          <button
            onClick={() => setFilterType('code')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
              filterType === 'code' 
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Code & Data
          </button>
        </div>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Files Grid & Dropzone */}
      <div 
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className="flex-1 overflow-y-auto p-4 sm:p-6"
      >
        {filteredFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl max-w-xl mx-auto my-6">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-900 text-neutral-400 flex items-center justify-center mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              {searchQuery ? 'No matching files found' : 'No files in workspace yet'}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mt-1 mb-5">
              Drag and drop images, PDFs, CSVs, or source code files here, or click upload to get started.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold cursor-pointer shadow-xs"
            >
              Browse Files
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFiles.map(file => {
              const isEditing = editingId === file.id;
              const isAnalyzing = analyzingId === file.id;

              return (
                <div 
                  key={file.id}
                  className="group relative flex flex-col bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                >
                  {/* Thumbnail / Header Area */}
                  <div className="h-32 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center relative overflow-hidden">
                    {file.previewUrl ? (
                      <img 
                        src={file.previewUrl} 
                        alt={file.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-neutral-400">
                        {getFileIcon(file.type, file.extension)}
                        <span className="text-[11px] font-mono uppercase font-semibold">
                          {file.extension || 'FILE'}
                        </span>
                      </div>
                    )}

                    {/* Quick overlay buttons */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewItem(file)}
                        className="p-1.5 rounded-lg bg-white/90 text-neutral-900 hover:bg-white shadow-xs cursor-pointer"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => attachFileToCurrentChat(file)}
                        className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer"
                        title="Attach to Chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>

                    {file.isGenerated && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-indigo-500/90 text-white text-[10px] font-medium backdrop-blur-xs">
                        AI Generated
                      </span>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="flex-1 px-1.5 py-0.5 rounded border border-blue-500 text-xs bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white outline-none"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              if (editName.trim()) renameFile(file.id, editName.trim());
                              setEditingId(null);
                            }
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button 
                          onClick={() => {
                            if (editName.trim()) renameFile(file.id, editName.trim());
                            setEditingId(null);
                          }}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-neutral-800 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-1">
                        <h4 
                          className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white truncate flex-1"
                          title={file.name}
                        >
                          {file.name}
                        </h4>
                        <button 
                          onClick={() => {
                            setEditingId(file.id);
                            setEditName(file.name);
                          }}
                          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>{formatBytes(file.size)}</span>
                      <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>

                    {/* Summary or Preview Text snippet if available */}
                    {file.summary && (
                      <div className="p-2 rounded bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-2">
                        {file.summary}
                      </div>
                    )}

                    {/* Bottom Action Buttons */}
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-1 text-xs">
                      <button
                        onClick={() => handleAnalyze(file.id)}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
                      </button>

                      <div className="flex items-center gap-1 text-neutral-400">
                        <a
                          href={file.url}
                          download={file.name}
                          className="p-1 hover:text-neutral-700 dark:hover:text-white rounded"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="p-1 hover:text-red-600 rounded cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewItem && (
        <div 
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                {getFileIcon(previewItem.type, previewItem.extension)}
                <span className="font-semibold text-sm truncate text-neutral-900 dark:text-white">
                  {previewItem.name}
                </span>
              </div>
              <button 
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950">
              {previewItem.previewUrl ? (
                <img 
                  src={previewItem.previewUrl} 
                  alt={previewItem.name} 
                  className="max-h-[50vh] max-w-full rounded-lg object-contain shadow-md"
                />
              ) : previewItem.textContent ? (
                <pre className="w-full text-xs font-mono p-4 rounded-lg bg-neutral-900 text-neutral-100 overflow-x-auto max-h-[50vh] whitespace-pre-wrap">
                  {previewItem.textContent}
                </pre>
              ) : (
                <div className="text-center py-8 text-neutral-400 text-sm">
                  Binary document preview. Download to view full contents.
                </div>
              )}

              {previewItem.summary && (
                <div className="mt-4 w-full p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-neutral-800 dark:text-neutral-200">
                  <div className="font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Summary
                  </div>
                  <p className="leading-relaxed">{previewItem.summary}</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900 text-xs">
              <span className="text-neutral-500">{formatBytes(previewItem.size)}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    attachFileToCurrentChat(previewItem);
                    setPreviewItem(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer"
                >
                  Attach to Chat
                </button>
                <a
                  href={previewItem.url}
                  download={previewItem.name}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-medium flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
