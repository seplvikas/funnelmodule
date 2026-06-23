import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { loginRequest, nativeAuthResponseStorageKey } from '../config/msal';
import { logAuthDebug, getAuthDebugLog } from '../utils/authDebug';
import { consumePostLoginRedirect, extractNextFromMsalState, buildCentralLoginUrl, getSafeNextFromSearch } from '../utils/sso';

const CENTRAL_AUTH_ORIGIN = import.meta.env.VITE_CENTRAL_AUTH_ORIGIN || 'https://demo.surbhi.net';
const MSAL_RETRY_KEY = 'spm_msal_retry';
const MSAL_RETRY_TTL_MS = 3 * 60 * 1000; // retry counter expires after 3 minutes
const MAX_MSAL_RETRIES = 2;

interface CallbackError {
  summary: string;
  detail?: string;
  debugSteps?: string[];
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { instance } = useMsal();
  const { login } = useAuth();
  const [error, setError] = useState<CallbackError | null>(null);
  const [showDebugLog, setShowDebugLog] = useState(false);
  const [debugLogCopied, setDebugLogCopied] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Auto-recovery: clears stale MSAL cache and restarts login flow
    // Called when MSAL cache exists but can't match the incoming auth response (state mismatch)
    const autoRecoverLogin = () => {
      // Use time-based retry counter so it expires naturally (e.g. if user clears cache or waits)
      let retryCount = 0;
      try {
        const stored = JSON.parse(sessionStorage.getItem(MSAL_RETRY_KEY) || 'null');
        if (stored && Date.now() - stored.ts < MSAL_RETRY_TTL_MS) {
          retryCount = stored.count;
        }
        // If TTL expired, treat as fresh start
      } catch { /* ignore parse errors */ }

      logAuthDebug('callback-auto-recover', { retryCount, maxRetries: MAX_MSAL_RETRIES });

      if (retryCount >= MAX_MSAL_RETRIES) {
        logAuthDebug('callback-auto-recover-exhausted', { retryCount });
        // Reset counter so next manual attempt starts fresh
        sessionStorage.removeItem(MSAL_RETRY_KEY);
        setError({
          summary: 'Microsoft sign-in did not complete.',
          detail: 'Authentication failed after multiple attempts. '
            + 'Please clear your browser cache (Ctrl+Shift+Delete), '
            + 'close and reopen your browser, then try again.',
          debugSteps: [
            'Auto-recovery attempted but failed.',
            '1. Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)',
            '2. Select: All time → Cookies + Cached files → Clear',
            '3. Close browser completely',
            '4. Open fresh browser and try again',
          ],
        });
        return;
      }

      // Increment counter with timestamp
      sessionStorage.setItem(MSAL_RETRY_KEY, JSON.stringify({ count: retryCount + 1, ts: Date.now() }));

      // Clear all stale MSAL state from localStorage
      Object.keys(localStorage)
        .filter(k => k.startsWith('msal.'))
        .forEach(key => localStorage.removeItem(key));

      logAuthDebug('callback-auto-recover-cleared-cache', { keysCleared: true, attempt: retryCount + 1 });

      // Preserve the post-login destination so redirect still works after recovery
      const next = getSafeNextFromSearch(window.location.search)
        || consumePostLoginRedirect()
        || null;

      const loginUrl = next
        ? buildCentralLoginUrl(next)
        : `${CENTRAL_AUTH_ORIGIN}/login`;

      window.location.replace(loginUrl);
    };

    const processCallback = async () => {
      const nativeAuthResponse = localStorage.getItem(nativeAuthResponseStorageKey)
        || sessionStorage.getItem(nativeAuthResponseStorageKey) || '';
      const redirectResponse = nativeAuthResponse || window.location.search || window.location.hash || '';

      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      const tryLateAccountRecovery = async () => {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          await wait(250 * (attempt + 1));
          if (!mounted) return null;

          const lateAccounts = instance.getAllAccounts();
          logAuthDebug('callback-late-account-check', {
            attempt: attempt + 1,
            accountCount: lateAccounts.length,
          });

          if (lateAccounts.length > 0) {
            try {
              const fallbackToken = await instance.acquireTokenSilent({
                ...loginRequest,
                account: lateAccounts[0],
              });
              logAuthDebug('callback-late-account-token-acquired', {
                attempt: attempt + 1,
                account: lateAccounts[0]?.username || null,
                hasToken: Boolean(fallbackToken),
              });
              return fallbackToken;
            } catch (lateSilentErr: any) {
              logAuthDebug('callback-late-account-silent-failed', {
                attempt: attempt + 1,
                error: lateSilentErr?.message || null,
              });
            }
          }
        }

        return null;
      };

      logAuthDebug('callback-page-opened', {
        isNative: Capacitor.isNativePlatform(),
        pathname: window.location.pathname,
        hasNativeResponse: Boolean(nativeAuthResponse),
        searchLength: window.location.search.length,
        hashLength: window.location.hash.length,
        redirectResponseLength: redirectResponse.length,
      });

      try {
        const msalCacheKeys = Object.keys(localStorage).filter(k => k.startsWith('msal.'));
        logAuthDebug('callback-cache-check', {
          cacheKeyCount: msalCacheKeys.length,
          redirectResponseLength: redirectResponse.length,
        });

        logAuthDebug('callback-before-handle-redirect', {
          hasHash: Boolean(window.location.hash),
          hasSearch: Boolean(window.location.search),
        });

        // Try implicit first (MSAL reads window.location internally)
        let redirectResult = await instance.handleRedirectPromise();

        logAuthDebug('callback-after-implicit-handle', {
          hasResult: Boolean(redirectResult),
          hasAccount: Boolean(redirectResult?.account),
        });

        // Fallback: try explicit hash/search parameter
        if (!redirectResult && (window.location.hash || window.location.search)) {
          const hashOrSearch = nativeAuthResponse || (window.location.hash || window.location.search);
          logAuthDebug('callback-trying-explicit-hash', { paramLength: hashOrSearch.length });
          redirectResult = await instance.handleRedirectPromise(hashOrSearch);
        }

        if (!mounted) return;

        let effectiveResult = redirectResult;

        logAuthDebug('callback-handle-redirect-result', {
          hasResult: Boolean(redirectResult),
          hasAccount: Boolean(redirectResult?.account),
          hasToken: Boolean(redirectResult?.accessToken || redirectResult?.idToken),
        });

        // ── Fallback 1: MsalProvider may have already processed the redirect internally.
        // In MSAL React v3, MsalProvider calls handleRedirectPromise() on startup,
        // consuming the response before our manual call. Accounts are still available.
        if (!effectiveResult) {
          const lateResult = await tryLateAccountRecovery();
          if (lateResult) {
            effectiveResult = lateResult;
          }
        }

        // ── Fallback 2: State mismatch (stale MSAL cache). Auto-recover by clearing
        // the stale state and restarting the login flow. Only triggered if we actually
        // have a redirect response and cache keys (confirming a real state mismatch).
        if (!effectiveResult && redirectResponse.length > 0 && msalCacheKeys.length > 0) {
          const accounts = instance.getAllAccounts();
          logAuthDebug('callback-stale-state-auto-recover', {
            cacheKeyCount: msalCacheKeys.length,
            redirectResponseLength: redirectResponse.length,
          });
          autoRecoverLogin();
          return;
        }

        if (!effectiveResult) {
          logAuthDebug('callback-no-redirect-result-final', {
            redirectResponseLength: redirectResponse.length,
            cacheKeys: msalCacheKeys.length,
          });
          setError({
            summary: 'Microsoft sign-in did not complete.',
            detail: 'The app returned from the browser but no login result was found. '
              + 'Please try signing in again.',
            debugSteps: [
              `Redirect response received: ${redirectResponse.length > 0 ? 'YES (' + redirectResponse.length + ' chars)' : 'NO'}`,
              `MSAL cache keys in localStorage: ${msalCacheKeys.length}`,
              `Running on native (Android): ${Capacitor.isNativePlatform() ? 'YES' : 'NO'}`,
              'If this error keeps appearing, clear browser cache (Ctrl+Shift+Delete) and try again.',
            ],
          });
          return;
        }

        const account = effectiveResult.account;
        const claims = effectiveResult.idTokenClaims as any;
        const email = account?.username || claims?.preferred_username;
        const name = account?.name || claims?.name || email;
        const oid = claims?.oid;
        const idToken = effectiveResult.idToken;

        logAuthDebug('callback-msal-success', {
          account: account?.username || null,
          hasIdToken: Boolean(idToken),
          oid: oid || null,
        });

        if (!email || !idToken) {
          throw new Error('Microsoft returned an incomplete token (missing email or id_token).');
        }

        const response = await authApi.azureCallback({
          id_token: idToken,
          email,
          name: name || email,
          oid,
        });

        if (!mounted) return;

        const { token, user } = response.data;
        logAuthDebug('callback-backend-success', {
          userId: user?.id || null,
          email: user?.email || email,
          hasToken: Boolean(token),
        });
        login(user, token);
        // Clear retry counter on success
        sessionStorage.removeItem(MSAL_RETRY_KEY);
        const stateRedirect = extractNextFromMsalState(effectiveResult.state);
        const postLoginRedirect = stateRedirect || consumePostLoginRedirect();
        if (postLoginRedirect) {
          window.location.replace(postLoginRedirect);
          return;
        }
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        if (!mounted) return;
        console.error('Auth callback failed:', err);

        const status = err?.response?.status;
        const backendError = err?.response?.data?.error;
        const backendCode = err?.response?.data?.code;

        logAuthDebug('callback-error', {
          errorCode: err?.errorCode || err?.code || null,
          message: err?.message || null,
          responseStatus: status || null,
          responseError: backendError || null,
          responseCode: backendCode || null,
        });

        let summary = 'Sign-in failed.';
        let detail = err?.message || 'An unexpected error occurred.';
        const debugSteps: string[] = [`Error: ${err?.errorCode || err?.code || err?.message || 'unknown'}`];

        if (backendCode === 'USER_INACTIVE') {
          summary = 'Account not activated';
          detail = 'Your account exists in Microsoft but has not been activated in this portal. '
            + 'Please contact an administrator to activate your account.';
          debugSteps.push('HTTP 403 - USER_INACTIVE from backend');
        } else if (status === 403) {
          summary = 'Access denied';
          detail = backendError || 'Your account does not have access to this portal.';
          debugSteps.push(`HTTP 403 from backend: ${backendError || 'no detail'}`);
        } else if (status === 500) {
          summary = 'Server error during sign-in';
          detail = 'The server failed while verifying your login. Please try again.';
          debugSteps.push('HTTP 500 from backend');
        } else if (!status && err?.errorCode) {
          summary = 'Microsoft sign-in error';
          detail = `MSAL error: ${err.errorCode}. ${err.message || ''}`;
          debugSteps.push(`MSAL errorCode: ${err.errorCode}`);
        }

        setError({ summary, detail, debugSteps });
      } finally {
        localStorage.removeItem(nativeAuthResponseStorageKey);
        sessionStorage.removeItem(nativeAuthResponseStorageKey);
      }
    };

    processCallback();

    return () => { mounted = false; };
  }, [instance, login, navigate]);

  const handleCopyDebugLog = async () => {
    const log = getAuthDebugLog();
    const text = JSON.stringify(log, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setDebugLogCopied(true);
      setTimeout(() => setDebugLogCopied(false), 2500);
    } catch {
      setShowDebugLog(true);
    }
  };

  if (error) {
    const log = getAuthDebugLog();
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="max-w-lg w-full bg-white border border-red-200 rounded-xl p-6 space-y-4">
          <div className="text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <h1 className="text-lg font-semibold text-red-900">{error.summary}</h1>
            <p className="text-sm text-red-700 mt-1">{error.detail}</p>
          </div>

          {error.debugSteps && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-800 mb-1">Diagnostics</p>
              <ul className="space-y-1">
                {error.debugSteps.map((step, i) => (
                  <li key={i} className="text-xs text-red-700 font-mono">• {step}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <a
              href="/login"
              className="w-full inline-flex items-center justify-center rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium"
            >
              Try Again
            </a>

            <a
              href="/logs"
              className="w-full inline-flex items-center justify-center rounded-lg bg-white text-gray-700 border border-gray-300 px-4 py-2 text-sm font-medium"
            >
              Open Logs Tab
            </a>

            {log.length > 0 && (
              <button
                type="button"
                onClick={handleCopyDebugLog}
                className="w-full inline-flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 text-sm font-medium"
              >
                {debugLogCopied ? '✓ Copied!' : '📋 Copy Debug Log'}
              </button>
            )}

            {log.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDebugLog(v => !v)}
                className="w-full text-xs text-gray-400 underline"
              >
                {showDebugLog ? 'Hide' : 'Show'} full debug log
              </button>
            )}
          </div>

          {showDebugLog && log.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-3 overflow-auto max-h-64">
              <pre className="text-xs text-green-400 whitespace-pre-wrap">
                {JSON.stringify(log, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6 text-center">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mt-4">Completing sign-in…</h1>
        <p className="text-sm text-gray-600 mt-2">Please wait while we verify your login.</p>
      </div>
    </div>
  );
}
