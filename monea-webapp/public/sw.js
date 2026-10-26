/**
 * MONEA Service Worker v10
 * Handles static assets caching & SPA navigation fallback gracefully.
 *
 * v3 changes:
 *  - Third-party origins (Cloudinary, ImageKit, Unsplash, Google Fonts, the API
 *    worker) are no longer intercepted at all. The previous handler ran
 *    `caches.match()` for every cross-origin request, which is a guaranteed miss
 *    and pure overhead on the critical path, and it also put a second,
 *    uncontrolled cache layer in front of CDN responses that already ship
 *    immutable, long-lived cache headers.
 *  - Responses explicitly marked `Cache-Control: no-store` are never cached.
 *
 * v4 changes (fixes the "FetchEvent for /sign-up resulted in a network error
 * response: the promise was rejected" console error):
 *  - A shell/document request can no longer abort the page load. Previously only
 *    `request.mode === 'navigate'` was treated as a navigation, so any document
 *    fetch reported with another mode (or replayed from a history entry) fell
 *    through to the asset branch, whose catch block re-threw the network error.
 *    Documents are now detected by mode *or* destination *or* `Accept: text/html`
 *    and always resolve: network -> cached shell -> synthesised offline shell.
 *  - Requests replayed with `cache: 'only-if-cached'` (Chrome uses this for
 *    back/forward and reload navigations) are answered straight from the cache
 *    and are never re-issued through `fetch()`: the Fetch spec rejects such a
 *    request when its mode is not `same-origin`, which is precisely the
 *    `TypeError: Failed to fetch` seen in the console.
 *  - A failed asset fetch now returns a 504 instead of rejecting
 *    `respondWith()`, so one unreachable file can no longer surface as an
 *    unhandled rejection.
 *
 * v6 changes:
 *  - HTML SPA fallbacks are never accepted or cached as static assets. Invalid
 *    cached script/style responses are removed and fetched again, preventing a
 *    stale Pages fallback from breaking lazy-loaded modules after deployment.
 *
 * v7 changes:
 *  - Purges v6 asset caches so clients recover from mixed-version module graphs
 *    after a deployment.
 *
 * v8 changes:
 *  - Purges v7 asset caches so clients recover from stale module graphs after
 *    the deployment.
 *
 * v9 changes:
 *  - Refreshes the app shell with the current MONEO logo and manifest.
 *
 * v10 changes:
 *  - Removes missing legacy PNG icons from the precache and uses existing branding fallbacks.
 */

const CACHE_NAME = 'monea-v10';
const CACHE_PREFIX = 'monea-';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/logomoneo.webp',
];

// Install: Cache critical shell assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Delete all previous outdated caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          // Only purge our own generations — never touch caches another
          // library/experiment on this origin may own.
          if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/**
 * A response is only worth caching when it is not explicitly marked private or
 * non-storable. Vite emits hashed, immutable asset filenames, so re-storing them
 * is harmless; this guard exists to keep auth/session-bearing responses out.
 */
function isCacheable(response) {
  const cc = response.headers.get('Cache-Control') || '';
  if (/no-store|private/i.test(cc)) return false;
  return true;
}

function isValidAssetResponse(request, response) {
  if (!response || response.status !== 200) return false;
  const contentType = response.headers.get('Content-Type') || '';
  if (/text\/html/i.test(contentType)) return false;
  if (request.destination === 'script' && !/(java|ecma)script/i.test(contentType)) return false;
  if (request.destination === 'style' && !/text\/css/i.test(contentType)) return false;
  return true;
}

/**
 * True for anything that produces the HTML document itself: top-level
 * navigations, iframe loads and any explicit HTML fetch.
 */
function isShellRequest(request) {
  if (request.mode === 'navigate' || request.destination === 'document') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

const OFFLINE_SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MONEO — កំពុងភ្ជាប់ឡើងវិញ / Reconnecting</title>
    <style>
      body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
             font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
             background:#0b0b0f; color:#f5f5f7; text-align:center; padding:24px; }
      .card { max-width:420px; }
      h1 { font-size:20px; margin:0 0 8px; }
      p { font-size:14px; line-height:1.6; color:#a1a1aa; margin:0 0 20px; }
      button { padding:12px 22px; border:0; border-radius:12px; background:#e11d48; color:#fff;
               font-weight:700; font-size:14px; cursor:pointer; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>គ្មានការតភ្ជាប់ / You are offline</h1>
      <p>សូមពិនិត្យអ៊ីនធឺណិត រួចព្យាយាមម្តងទៀត។<br />Check your connection and try again.</p>
      <button onclick="location.reload()">ព្យាយាមម្តងទៀត / Retry</button>
    </div>
  </body>
</html>`;

function offlineShellResponse() {
  return new Response(OFFLINE_SHELL, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/**
 * The best HTML we can serve without the network: the pre-cached SPA shell, or a
 * self-contained offline page. Never resolves to `undefined` — a `respondWith()`
 * resolving to `undefined` is itself a network error.
 */
async function cachedShellResponse() {
  for (const url of ['/index.html', '/']) {
    const cached = await caches.match(url);
    if (cached) return cached;
  }
  return offlineShellResponse();
}

/**
 * Document requests are network-first so a deploy is picked up immediately, with
 * the cached shell as the fallback. This promise must never reject.
 */
async function handleShellRequest(request) {
  // Chrome replays back/forward and reload navigations with `cache:
  // 'only-if-cached'`. Re-issuing such a request through `fetch()` throws
  // ("Failed to fetch") because its mode is `navigate`, not `same-origin`, so it
  // has to be answered from the cache only.
  if (request.cache === 'only-if-cached') {
    return cachedShellResponse();
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status < 400) return networkResponse;
    // 4xx/5xx from the host: prefer the SPA shell we already have.
    return await cachedShellResponse();
  } catch (fetchError) {
    console.warn('[SW] Navigation fell back to the cached shell:', request.url, fetchError);
    return cachedShellResponse();
  }
}

/**
 * Assets stay cache-first (Vite emits hashed, immutable filenames). Validate
 * cached and network responses so an SPA HTML fallback is never served as JS.
 */
async function handleAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    if (isValidAssetResponse(request, cachedResponse)) {
      fetch(request)
        .then((networkResponse) => {
          if (isValidAssetResponse(request, networkResponse) && isCacheable(networkResponse)) {
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone);
          }
        })
        .catch(() => { /* ignore background update errors */ });
      return cachedResponse;
    }

    await cache.delete(request);
  }

  try {
    const networkResponse = await fetch(request);
    if (!isValidAssetResponse(request, networkResponse)) {
      console.warn('[SW] Invalid asset response:', request.url, networkResponse?.headers.get('Content-Type'));
      if (networkResponse?.status === 200) {
        return new Response('', {
          status: 502,
          statusText: 'Invalid asset response',
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
        });
      }
      return networkResponse;
    }
    if (networkResponse.type === 'basic' && isCacheable(networkResponse)) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    return networkResponse;
  } catch (fetchError) {
    // Resolve instead of re-throwing: a rejected `respondWith()` promise is
    // reported by the browser as an unhandled network error response.
    console.warn('[SW] Asset unavailable:', request.url, fetchError);
    if (request.destination === 'image') {
      return new Response('', { status: 404, statusText: 'Not Found' });
    }
    return new Response('', { status: 504, statusText: 'Gateway Timeout' });
  }
}

// Fetch: Smart routing & error safety
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Never intercept non-GET requests, API calls, or cross-origin requests.
  if (
    request.method !== 'GET' ||
    request.url.includes('/api/') ||
    request.url.includes('workers.dev')
  ) {
    return; // Let browser handle natively
  }

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Cross-origin media/CDN: the browser's HTTP cache plus the CDN's own
  // immutable headers already handle this correctly. Intercepting would add a
  // lookup that always misses while preventing the CDN cache from doing its job.
  if (!sameOrigin) {
    return;
  }

  // 2. SPA shell requests (e.g. /sign-up, /dashboard, /dashboard/schedule).
  if (isShellRequest(request)) {
    event.respondWith(handleShellRequest(request));
    return;
  }

  // 3. `only-if-cached` must never reach the network — see handleShellRequest().
  if (request.cache === 'only-if-cached') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse && isValidAssetResponse(request, cachedResponse)) return cachedResponse;
        if (cachedResponse) await cache.delete(request);
        return new Response('', { status: 504, statusText: 'Gateway Timeout' });
      })
    );
    return;
  }

  // 4. Static assets: cache-first with network fallback
  event.respondWith(handleAssetRequest(request));
});
