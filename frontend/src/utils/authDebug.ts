const AUTH_DEBUG_STORAGE_KEY = 'sepl.authDebugLog';
const MAX_AUTH_DEBUG_ENTRIES = 200;

type AuthDebugDetails = Record<string, unknown>;

interface AuthDebugEntry {
  timestamp: string;
  event: string;
  details?: AuthDebugDetails;
}

export type { AuthDebugEntry };

function sanitizeErrorDetails(details?: AuthDebugDetails) {
  if (!details) return undefined;

  const sanitized = { ...details };

  if ('idToken' in sanitized) sanitized.idToken = '[redacted]';
  if ('token' in sanitized) sanitized.token = '[redacted]';
  if ('authorization' in sanitized) sanitized.authorization = '[redacted]';

  return sanitized;
}

export function logAuthDebug(event: string, details?: AuthDebugDetails) {
  const entry: AuthDebugEntry = {
    timestamp: new Date().toISOString(),
    event,
    details: sanitizeErrorDetails(details),
  };

  try {
    const existing = window.localStorage.getItem(AUTH_DEBUG_STORAGE_KEY);
    const parsed: AuthDebugEntry[] = existing ? JSON.parse(existing) : [];
    parsed.push(entry);
    const trimmed = parsed.slice(-MAX_AUTH_DEBUG_ENTRIES);
    window.localStorage.setItem(AUTH_DEBUG_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (storageError) {
    console.error('[AUTH DEBUG] Failed to persist auth debug log', storageError);
  }

  console.log('[AUTH DEBUG]', event, entry.details || {});
}

export function clearAuthDebugLog() {
  window.localStorage.removeItem(AUTH_DEBUG_STORAGE_KEY);
}

export function getAuthDebugLog(): AuthDebugEntry[] {
  try {
    const stored = window.localStorage.getItem(AUTH_DEBUG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

declare global {
  interface Window {
    dumpAuthDebugLog?: () => AuthDebugEntry[];
    clearAuthDebugLog?: () => void;
  }
}

if (typeof window !== 'undefined') {
  window.dumpAuthDebugLog = getAuthDebugLog;
  window.clearAuthDebugLog = clearAuthDebugLog;
}
