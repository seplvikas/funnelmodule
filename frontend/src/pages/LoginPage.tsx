import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../context/AuthContext';
import { clearJustLoggedOutCookie, getCookie } from '../context/AuthContext';
import { loginRequest } from '../config/msal';
import { clearAuthDebugLog, logAuthDebug } from '../utils/authDebug';
import {
  buildCentralLoginUrl,
  buildMsalSsoState,
  getSafeNextFromSearch,
  isCentralAuthHostname,
  isStandaloneSurbhiApp,
  persistPostLoginRedirect,
} from '../utils/sso';

const CENTRAL_AUTH_ORIGIN = import.meta.env.VITE_CENTRAL_AUTH_ORIGIN || 'https://demo.surbhi.net';
const MSAL_RETRY_KEY = 'spm_msal_retry';

function isExpectedNativeRedirectHandoffError(error: any) {
  const errorCode = error?.errorCode || error?.code || '';
  const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';

  return errorCode === 'timed_out'
    || message.includes('failed_to_redirect')
    || message.includes('request timed out');
}

export function LoginPage() {
  const navigate = useNavigate();
  const { instance } = useMsal();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const hasAutoTriggeredRef = useRef(false);

  const handleMicrosoftLogin = useCallback(async () => {
    clearAuthDebugLog();
    setLoading(true);
    setError('');
    sessionStorage.removeItem(MSAL_RETRY_KEY);
    // Clear the just-logged-out flag when user explicitly signs in
    clearJustLoggedOutCookie();

    const next = getSafeNextFromSearch(window.location.search);
    if (next) {
      persistPostLoginRedirect(next);
    }

    if (Capacitor.isNativePlatform()) {
      logAuthDebug('login-start-native', {
        redirectUri: window.location.href,
      });
      instance.loginRedirect(loginRequest).catch((err: any) => {
        if (isExpectedNativeRedirectHandoffError(err)) {
          logAuthDebug('login-native-handoff-timeout', {
            errorCode: err?.errorCode || err?.code || null,
            message: err?.message || null,
          });
          return;
        }

        console.error('Native SSO login failed:', err);
        logAuthDebug('login-native-error', {
          errorCode: err?.errorCode || err?.code || null,
          message: err?.message || null,
          responseStatus: err?.response?.status || null,
        });
        setError(err?.response?.data?.error || err?.message || 'Login failed. Please try again.');
        setLoading(false);
      });
      return;
    }

    if (isStandaloneSurbhiApp(window.location.hostname)) {
      // Redirect to central login with the subdomain as 'next' parameter
      // Even on /login or /auth-callback, we preserve the subdomain for post-login redirect
      const pathname = window.location.pathname;
      if (pathname === '/login' || pathname === '/auth-callback') {
        // Use subdomain origin (not the /login or /auth-callback path) as the redirect target
        const subdomain_origin = `${window.location.protocol}//${window.location.host}`;
        const subdomain_next = window.location.hostname === 'emd.surbhi.net'
          ? `${subdomain_origin}/dashboard?page=emd`
          : `${subdomain_origin}/dashboard`;
        window.location.replace(buildCentralLoginUrl(subdomain_next));
      } else {
        window.location.replace(buildCentralLoginUrl(window.location.href));
      }
      return;
    }

    try {
      const request = next
        ? { ...loginRequest, state: buildMsalSsoState(next) }
        : loginRequest;

      logAuthDebug('login-start-web', {
        redirectUri: window.location.href,
        mode: 'redirect',
      });
      
      // IMPORTANT: Explicitly ensure MSAL state is persisted to localStorage
      // before starting loginRedirect, to survive the browser redirect
      logAuthDebug('login-ensure-cache', {
        localStorageAvailable: typeof localStorage !== 'undefined',
        localStorageSize: Object.keys(localStorage).length,
        msalKeysBefore: Object.keys(localStorage).filter(k => k.startsWith('msal.')).length,
      });
      
      await instance.loginRedirect(request);
      return;
    } catch (err: any) {
      console.error('SSO login failed:', err);
      logAuthDebug('login-web-error', {
        errorCode: err?.errorCode || err?.code || null,
        message: err?.message || null,
        responseStatus: err?.response?.status || null,
      });
      setError(err.response?.data?.error || err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  }, [instance]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    if (isStandaloneSurbhiApp(window.location.hostname)) {
      // Redirect to central login with the subdomain as 'next' parameter
      // Even on /login or /auth-callback, we preserve the subdomain for post-login redirect
      const pathname = window.location.pathname;
      if (pathname === '/login' || pathname === '/auth-callback') {
        // Use subdomain origin (not the /login or /auth-callback path) as the redirect target
        const subdomain_origin = `${window.location.protocol}//${window.location.host}`;
        const subdomain_next = window.location.hostname === 'emd.surbhi.net'
          ? `${subdomain_origin}/dashboard?page=emd`
          : `${subdomain_origin}/dashboard`;
        window.location.replace(buildCentralLoginUrl(subdomain_next));
      } else {
        window.location.replace(buildCentralLoginUrl(window.location.href));
      }
      return;
    }

    const next = getSafeNextFromSearch(window.location.search);
    if (!next) return;

    if (isAuthenticated) {
      window.location.replace(next);
      return;
    }

    // Auto-trigger login only for the central auth host (demo.surbhi.net)
    // Other domains (emd, letter, activity) require manual login click for better UX
    const isTesting = window.location.hostname === 'demo.surbhi.net';
    if (isTesting && !hasAutoTriggeredRef.current) {
      hasAutoTriggeredRef.current = true;
      // Do NOT auto-trigger if the user just logged out — they must click manually
      const justLoggedOut = getCookie('spm_just_logged_out');
      if (!justLoggedOut) {
        handleMicrosoftLogin();
      }
    }
  }, [handleMicrosoftLogin, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <img src="/logo/SEPL_full_logo1.png" alt="Surbhi Portal Management" className="h-24 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Surbhi Portal Management</h1>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              Sign in with your Microsoft work account to access your reminders.
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleMicrosoftLogin}
              disabled={loading}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Sign in with Microsoft</span>
                </div>
              )}
            </button>


          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600">
              <ShieldCheck className="h-4 w-4 mr-2 text-green-500" />
              <span>Enterprise login with Azure Active Directory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
