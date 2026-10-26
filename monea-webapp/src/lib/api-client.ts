/**
 * MONEA Centralized API Client
 * 
 * Provides a hardened fetch wrapper that handles:
 * 1. Automatic CSRF token management for mutable requests.
 * 2. Consistent error handling and normalization.
 * 3. Environment-aware configurations.
 */

import { getApiUrl } from './api-url';
import { isNetworkError, NETWORK_ERROR_MESSAGE, notifyNetworkError } from './network-errors';

let cachedCsrfToken: string | null = null;
let lastCsrfFetch: number = 0;
const CSRF_TTL = 1000 * 60 * 45; // 45 minutes

async function getCsrfToken(): Promise<string | null> {
    const now = Date.now();
    if (!cachedCsrfToken && typeof window !== 'undefined') {
        try {
            cachedCsrfToken = sessionStorage.getItem('csrf_token');
        } catch (error) {
            console.warn("[MoneaClient] Could not read cached CSRF token:", error);
        }
    }

    if (cachedCsrfToken && (now - lastCsrfFetch < CSRF_TTL)) {
        return cachedCsrfToken;
    }

    try {
        const res = await fetch(getApiUrl("api/auth/csrf"), {
            credentials: 'include',
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch CSRF token (HTTP ${res.status})`);
        }
        const data: unknown = await res.json();
        const token =
            data && typeof data === 'object' && 'token' in data &&
            typeof data.token === 'string' && data.token.length > 0
                ? data.token
                : null;
        if (!token) {
            throw new Error("CSRF token response was invalid");
        }
        cachedCsrfToken = token;
        lastCsrfFetch = now;
        if (typeof window !== 'undefined') {
            try {
                sessionStorage.setItem('csrf_token', token);
            } catch (error) {
                console.warn("[MoneaClient] Could not cache CSRF token:", error);
            }
        }
        return cachedCsrfToken;
    } catch (err) {
        console.error("[MoneaClient] CSRF Fetch Error:", err);
        throw err;
    }
}

export type ApiResponse<T> = {
    data: T | null;
    error: string | null;
    code?: string;
    details?: any;
    status: number;
};

function notifyAuthExpired(path: string, status: number, requestStartedAt: number): void {
    if (status !== 401 || typeof window === "undefined") return;
    if (path.startsWith("/api/auth/") && path !== "/api/auth/me") return;
    window.dispatchEvent(new CustomEvent("monea:auth-expired", { detail: { requestStartedAt } }));
}

async function request<T>(
    path: string, 
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const method = options.method?.toUpperCase() || "GET";
    const isMutable = ["POST", "PUT", "DELETE", "PATCH"].includes(method);
    const requestStartedAt = Date.now();

    try {
        const headers = new Headers(options.headers);
        if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
            headers.set("Content-Type", "application/json");
        }

        if (isMutable && !headers.has("X-CSRF-Token")) {
            const token = await getCsrfToken();
            if (!token) {
                throw new Error("Could not obtain a CSRF token for this request");
            }
            headers.set("X-CSRF-Token", token);
        }

        // ✅ NEW: Check for token in sessionStorage (fallback if cookies don't work)
        if (!headers.has("Authorization")) {
            try {
                const storedToken = sessionStorage.getItem('auth_token');
                if (storedToken) {
                    headers.set("Authorization", `Bearer ${storedToken}`);
                    console.log('[MoneaClient] Using Authorization header with stored token');
                }
            } catch (e) {
                console.warn('[MoneaClient] Could not read auth_token from sessionStorage:', e);
            }
        }

        const response = await fetch(getApiUrl(path), { 
            ...options, 
            headers,
            credentials: 'include', // Include cookies for cross-origin
        });
        const text = await response.text();
        let data: unknown = null;
        
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            if (!response.ok) {
                data = null;
            } else {
                return {
                    data: null,
                    error: "Invalid response from server",
                    status: response.status,
                };
            }
        }

        if (!response.ok) {
            notifyAuthExpired(path, response.status, requestStartedAt);
            let normalizedError: string = `Request failed with status ${response.status}`;
            if (data && typeof data === 'object' && 'error' in data) {
                const apiError = data.error;
                if (typeof apiError === 'string') {
                    normalizedError = apiError;
                } else if (Array.isArray(apiError)) {
                    normalizedError = apiError.map((item: unknown) => {
                        if (!item || typeof item !== 'object') return String(item);
                        const issue = item as { message?: unknown; path?: unknown };
                        const path = Array.isArray(issue.path) ? `${issue.path.join('.')}: ` : '';
                        return `${path}${typeof issue.message === 'string' ? issue.message : 'Invalid request'}`;
                    }).join(', ');
                } else if (apiError) {
                    normalizedError = "The request could not be completed";
                }
            }

            return {
                data: null,
                error: normalizedError,
                code: data && typeof data === 'object' && 'code' in data && typeof data.code === 'string'
                    ? data.code
                    : undefined,
                details: data && typeof data === 'object' && 'details' in data
                    ? data.details
                    : undefined,
                status: response.status
            };
        }

        return {
            data: data as T,
            error: null,
            status: response.status
        };
    } catch (error: unknown) {
        console.error(`[MoneaClient] ${method} ${path} Error:`, error);
        const networkError = isNetworkError(error);
        if (networkError) notifyNetworkError(error);
        return {
            data: null,
            error: networkError
                ? NETWORK_ERROR_MESSAGE
                : error instanceof Error ? error.message : "Request could not be completed",
            code: networkError ? "NETWORK_ERROR" : undefined,
            status: 503
        };
    }
}

export const moneaClient = {
    get: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, body?: any, options?: RequestInit) => 
        request<T>(path, { 
            ...options, 
            method: "POST", 
            body: body instanceof FormData ? body : JSON.stringify(body) 
        }),
    put: <T>(path: string, body?: any, options?: RequestInit) => 
        request<T>(path, { 
            ...options, 
            method: "PUT", 
            body: body instanceof FormData ? body : JSON.stringify(body) 
        }),
    delete: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: "DELETE" }),
    patch: <T>(path: string, body?: any, options?: RequestInit) => 
        request<T>(path, { 
            ...options, 
            method: "PATCH", 
            body: body instanceof FormData ? body : JSON.stringify(body) 
        }),
};
