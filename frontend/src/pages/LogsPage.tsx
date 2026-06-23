import { useMemo, useState } from 'react';
import { Bug, Copy, RefreshCw, Trash2 } from 'lucide-react';
import { clearAuthDebugLog, getAuthDebugLog } from '../utils/authDebug';

export function LogsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const logs = useMemo(() => getAuthDebugLog(), [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleClear = () => {
    clearAuthDebugLog();
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Bug className="text-blue-600" size={20} />
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">App Logs</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Copy size={14} /> {copied ? 'Copied' : 'Copy Logs'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 bg-red-50 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-600">
            No logs available yet.
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg p-3 overflow-auto max-h-[70vh]">
            <pre className="text-xs text-green-300 whitespace-pre-wrap break-all">
              {JSON.stringify(logs, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
