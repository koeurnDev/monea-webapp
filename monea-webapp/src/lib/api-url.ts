/**
 * Get the API base URL
 * In production (static export), uses VITE_API_URL
 * In development, uses Vite proxy via relative path
 */
export function getApiUrl(path: string): string {
  if (!path) return '';

  // If path is already a full URL, return it directly
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  let cleanPath = path.startsWith('/') ? path.slice(1) : path;
  if (!cleanPath.startsWith('api/') && cleanPath !== 'api') {
    cleanPath = `api/${cleanPath}`;
  }
  
  // In local browser development, use relative path so Vite proxy forwards
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isDev = import.meta.env.DEV;
    
    // Use proxy ONLY in local development
    if (isLocal && isDev) {
      return `/${cleanPath}`;
    }
  }

  // Production: use environment variable, fallback to production worker URL
  const apiBase = (import.meta.env.VITE_API_URL || 'https://api.moneoez.com').replace(/\/$/, '');
  const finalUrl = `${apiBase}/${cleanPath}`;
  
  return finalUrl;
}

/**
 * Enhanced fetch that automatically uses correct API URL with mobile optimizations
 */
let requestCache = new Map();
let requestPromises = new Map();

// Mobile-specific optimizations
const isMobile = typeof window !== 'undefined' && (
  window.innerWidth <= 768 || 
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
);

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = getApiUrl(path);
  
  // Mobile: More aggressive request deduplication
  const method = init?.method || 'GET';
  const cacheKey = `${method}:${url}`;
  
  if (method === 'GET' && requestPromises.has(cacheKey)) {
    return requestPromises.get(cacheKey)!.then((r: Response) => r.clone());
  }
  
  // Include token from sessionStorage as Bearer auth if available
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('auth_token') : null;
  // Preserve existing headers (could be undefined, object, or Headers instance)
  const initHeaders = init?.headers instanceof Headers ? init.headers : new Headers(init?.headers);
  if (token) {
    initHeaders.set('Authorization', `Bearer ${token}`);
  }
  const fetchPromise = fetch(url, {
    ...init,
    headers: initHeaders,
    credentials: 'include',
    // Mobile optimizations
    cache: method === 'GET' ? 'force-cache' : 'no-cache',
    priority: isMobile ? 'high' : 'auto' as any,
    // Shorter timeout for mobile
    signal: AbortSignal.timeout(isMobile ? 10000 : 15000),
  });
  
  // Longer dedup window for mobile
  if (method === 'GET') {
    requestPromises.set(cacheKey, fetchPromise);
    setTimeout(() => requestPromises.delete(cacheKey), isMobile ? 3000 : 1000);
  }
  
  return fetchPromise;
}

/**
 * Mobile-optimized preloading
 */
export function preloadCriticalEndpoints() {
  if (typeof window !== 'undefined' && !isMobile) {
    // Only preload on non-mobile to save bandwidth
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        apiFetch('/system/status').catch(() => {});
      });
    }
  }
}
