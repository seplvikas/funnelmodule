const CENTRAL_AUTH_ORIGIN = import.meta.env.VITE_CENTRAL_AUTH_ORIGIN || 'https://demo.surbhi.net';
const POST_LOGIN_REDIRECT_KEY = 'spm_post_login_redirect';
const POST_LOGIN_REDIRECT_SESSION_KEY = 'spm_post_login_redirect_session';
const MSAL_SSO_STATE_PREFIX = 'spm-sso:';

function safeParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function getCentralAuthHost(): string {
  const parsed = safeParseUrl(CENTRAL_AUTH_ORIGIN);
  return parsed?.hostname || 'demo.surbhi.net';
}

export function isSurbhiHostname(hostname: string): boolean {
  return hostname === 'surbhi.net' || hostname.endsWith('.surbhi.net');
}

export function isCentralAuthHostname(hostname: string): boolean {
  const centralHost = getCentralAuthHost();
  // Only the configured central auth host should run direct auth pages.
  // All other subdomains should redirect to central login with a next URL.
  return hostname === centralHost;
}

export function isStandaloneSurbhiApp(hostname: string): boolean {
  return isSurbhiHostname(hostname) && !isCentralAuthHostname(hostname);
}

export function isAllowedReturnUrl(candidate: string): boolean {
  const parsed = safeParseUrl(candidate);
  if (!parsed) return false;

  const isHttpScheme = parsed.protocol === 'https:' || parsed.protocol === 'http:';
  if (!isHttpScheme) return false;

  // Allow HTTPS Surbhi domains in production and localhost/http in development.
  if (parsed.protocol === 'https:' && isSurbhiHostname(parsed.hostname)) return true;
  if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true;
  return false;
}

export function getSafeNextFromSearch(search: string): string | null {
  const next = new URLSearchParams(search).get('next') || '';
  if (!next) return null;
  return isAllowedReturnUrl(next) ? next : null;
}

export function buildCentralLoginUrl(nextUrl: string): string {
  const safeNext = isAllowedReturnUrl(nextUrl) ? nextUrl : CENTRAL_AUTH_ORIGIN;
  return `${CENTRAL_AUTH_ORIGIN}/login?next=${encodeURIComponent(safeNext)}`;
}

export function buildCentralLogoutUrl(): string {
  return `${CENTRAL_AUTH_ORIGIN}/login?logged_out=1`;
}

export function persistPostLoginRedirect(nextUrl: string): void {
  if (!isAllowedReturnUrl(nextUrl)) return;
  localStorage.setItem(POST_LOGIN_REDIRECT_KEY, nextUrl);
  sessionStorage.setItem(POST_LOGIN_REDIRECT_SESSION_KEY, nextUrl);
}

export function consumePostLoginRedirect(): string | null {
  const localValue = localStorage.getItem(POST_LOGIN_REDIRECT_KEY) || '';
  const sessionValue = sessionStorage.getItem(POST_LOGIN_REDIRECT_SESSION_KEY) || '';
  localStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_SESSION_KEY);

  if (localValue && isAllowedReturnUrl(localValue)) return localValue;
  if (sessionValue && isAllowedReturnUrl(sessionValue)) return sessionValue;
  return null;
}

export function buildMsalSsoState(nextUrl: string): string {
  const payload = JSON.stringify({ next: nextUrl, ts: Date.now() });
  return `${MSAL_SSO_STATE_PREFIX}${btoa(payload)}`;
}

export function extractNextFromMsalState(state?: string | null): string | null {
  if (!state || !state.startsWith(MSAL_SSO_STATE_PREFIX)) return null;

  try {
    const encoded = state.slice(MSAL_SSO_STATE_PREFIX.length);
    const parsed = JSON.parse(atob(encoded)) as { next?: string };
    const next = parsed?.next || '';
    return isAllowedReturnUrl(next) ? next : null;
  } catch {
    return null;
  }
}