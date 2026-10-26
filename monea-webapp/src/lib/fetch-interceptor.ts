/**
 * Global fetch interceptor for static export
 * Automatically redirects /api/* calls to VITE_API_URL and includes session cookies
 */
import { notifyNetworkError } from "./network-errors";

const originalFetch = globalThis.fetch;

async function fetchWithNetworkReporting(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await originalFetch(input, init);
  } catch (error) {
    notifyNetworkError(error);
    throw error;
  }
}

let cachedCsrfToken: string | null = null;
let lastCsrfFetch = 0;
const CSRF_TTL = 1000 * 60 * 45; // 45 minutes, matches the SPA API client

try {
  localStorage.removeItem('auth_token');
} catch {
  // Storage may be unavailable; authentication uses the HttpOnly session cookie.
}

/**
 * Returns a signed CSRF token, fetching one from the API when the cached value is
 * missing or stale.
 *
 * SECURITY: the worker now validates X-CSRF-Token on every state-changing,
 * cookie-authenticated request (monea-api-worker/lib/csrf.ts). Pages that call
 * `fetch()` directly instead of the moneaClient therefore need this interceptor to
 * attach the header, otherwise their writes would be rejected with 403.
 */
async function getCsrfToken(apiBase: string): Promise<string | null> {
  const now = Date.now();

  if (!cachedCsrfToken) {
    try {
      cachedCsrfToken = sessionStorage.getItem('csrf_token');
    } catch {
      // sessionStorage unavailable (private mode) — fall through to a network fetch
    }
  }

  if (cachedCsrfToken && now - lastCsrfFetch < CSRF_TTL) {
    return cachedCsrfToken;
  }

  try {
    const res = await fetchWithNetworkReporting(`${apiBase}/api/auth/csrf`, { credentials: 'include' });
    if (!res.ok) return cachedCsrfToken;

    const data: any = await res.json();
    if (data?.token) {
      cachedCsrfToken = data.token;
      lastCsrfFetch = now;
      try {
        sessionStorage.setItem('csrf_token', data.token);
      } catch {
        // ignore storage failures
      }
    }
    return cachedCsrfToken;
  } catch (err) {
    console.error('[FetchInterceptor] CSRF token fetch failed:', err);
    return cachedCsrfToken;
  }
}

export function setupFetchInterceptor() {
  if (typeof window === 'undefined') return; // Only run in browser
  
  globalThis.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const apiBase = (import.meta.env.VITE_API_URL || 'https://api.moneoez.com').replace(/\/$/, '');
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const isDev = import.meta.env.DEV;

    // In local browser development on localhost in dev mode, keep /api/ relative so Vite proxy forwards
    if (isLocal && isDev) {
      return fetchWithNetworkReporting(input, init);
    }

    let urlString = '';
    if (typeof input === 'string') {
      urlString = input;
    } else if (input instanceof URL) {
      urlString = input.href;
    } else if (input && typeof (input as Request).url === 'string') {
      urlString = (input as Request).url;
    }

    let isApiCall = false;
    let finalUrl = urlString;

    if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
      try {
        const parsed = new URL(urlString);
        const currentOrigin = window.location.origin;
        let apiOrigin = '';
        try {
          apiOrigin = new URL(apiBase).origin;
        } catch {}

        // If it's already pointing to the API worker origin
        if (apiOrigin && parsed.origin === apiOrigin) {
          isApiCall = true;
          finalUrl = urlString;
        } 
        // If it's a full URL to the frontend origin targeting /api/*
        else if (parsed.origin === currentOrigin && (parsed.pathname.startsWith('/api/') || parsed.pathname === '/api')) {
          isApiCall = true;
          let cleanPath = parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
          if (!cleanPath.startsWith('api/')) cleanPath = `api/${cleanPath}`;
          finalUrl = `${apiBase}/${cleanPath}${parsed.search}${parsed.hash}`;
        }
      } catch {
        // Fallback
      }
    } else if (urlString.startsWith('/api/') || urlString.startsWith('api/') || urlString === '/api' || urlString === 'api') {
      // Relative API path
      isApiCall = true;
      let cleanPath = urlString.startsWith('/') ? urlString.slice(1) : urlString;
      if (!cleanPath.startsWith('api/')) cleanPath = `api/${cleanPath}`;
      finalUrl = `${apiBase}/${cleanPath}`;
    }

    if (isApiCall) {
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      
      // Preserve method and body if input was a Request object
      const method = init?.method || (input instanceof Request ? input.method : 'GET');
      const body = init?.body || (input instanceof Request && method !== 'GET' && method !== 'HEAD' ? input.body : undefined);

      // ✅ Add Authorization header from sessionStorage if available (fallback for cookie issues)
      if (!headers.has('Authorization')) {
        try {
          const storedToken = sessionStorage.getItem('auth_token');
          if (storedToken) {
            headers.set('Authorization', `Bearer ${storedToken}`);
            console.log('[FetchInterceptor] Added Authorization header from sessionStorage');
          }
        } catch (e) {
          // sessionStorage may not be available
        }
      }

      // Attach the CSRF token to state-changing calls. The worker validates
      // X-CSRF-Token for every cookie-authenticated write (lib/csrf.ts), so raw
      // fetch() callers must present it just like the moneaClient does.
      const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
      if (isStateChanging && !headers.has('X-CSRF-Token')) {
        const csrfToken = await getCsrfToken(apiBase);
        if (csrfToken) {
          headers.set('X-CSRF-Token', csrfToken);
        }
      }

      const updatedInit: RequestInit = {
        ...init,
        method,
        body,
        headers,
        credentials: 'include',
      };

      const response = await fetchWithNetworkReporting(finalUrl, updatedInit);
      return response;
    }
    
    return fetchWithNetworkReporting(input, init);
  } as typeof fetch;
}

// Auto-setup on import
if (typeof window !== 'undefined') {
  setupFetchInterceptor();
}
