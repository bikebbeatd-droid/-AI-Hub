import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, AlertTriangle, Clock, Zap } from 'lucide-react';
import { useHub } from '../context/HubContext.tsx';
import * as api from '../services/api.ts';

export const ModelTestModal: React.FC = () => {
  const { testingModel, setTestingModel, providerKeys } = useHub();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  if (!testingModel) return null;

  const handleRunTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      const apiKey = providerKeys[testingModel.provider];
      const res = await api.testSpecificModel(testingModel.id, testingModel.provider, apiKey);
      setResult(res);
    } catch (err: any) {
      setResult({ success: false, error: err.message || 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div 
      onClick={() => setTestingModel(null)}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              Model Diagnostic Test
            </h3>
          </div>
          <button onClick={() => setTestingModel(null)} className="p-1 text-neutral-400 hover:text-neutral-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1">
          <div className="font-bold text-neutral-900 dark:text-white">{testingModel.displayName}</div>
          <div className="font-mono text-neutral-400">{testingModel.id}</div>
          <div className="font-mono uppercase text-neutral-500">Provider: {testingModel.provider}</div>
        </div>

        {result && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${result.success ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300'}`}>
            <div className="flex items-center gap-2 font-bold">
              {result.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{result.success ? 'Model Endpoint Responsive' : 'Test Failed'}</span>
            </div>
            {result.success ? (
              <div className="space-y-1 font-mono text-[11px]">
                <div>Latency: <strong>{result.latencyMs}ms</strong></div>
                <div>Response: "{result.response}"</div>
              </div>
            ) : (
              <div>{result.error?.message || result.error || 'Connection refused or missing key.'}</div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={() => setTestingModel(null)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Close
          </button>
          <button
            onClick={handleRunTest}
            disabled={testing}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing...' : 'Run Test Ping'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
