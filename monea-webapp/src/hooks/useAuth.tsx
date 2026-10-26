import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  useRef,
} from 'react'
import type { AuthUser } from '@/types/auth'
import { moneaClient } from '@/lib/api-client'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  refetch: (options?: { silent?: boolean }) => Promise<void>
  setAuthenticatedUser: (user: AuthUser) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  refetch: async () => { },
  setAuthenticatedUser: () => { },
  logout: async () => { },
})

/**
 * Optimized AuthProvider for mobile performance
 */
// ─── DEV-ONLY Auth Bypass ───────────────────────────────────────────────────
// Set VITE_DEV_BYPASS_AUTH=true in .env.local to skip login during UI development.
const DEV_MOCK_USER: AuthUser = {
  id: 'dev-user-001',
  userId: 'dev-user-001',
  email: 'dev@monea.test',
  name: 'Dev User',
  role: 'USER',
  weddingId: undefined,
  type: 'user',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const isBypassMode = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

  const [user, setUser] = useState<AuthUser | null>(isBypassMode ? DEV_MOCK_USER : null)
  const [isLoading, setIsLoading] = useState(isBypassMode ? false : true)
  const fetchingRef = useRef(false)
  const pendingSilentFetchRef = useRef(false)
  const retryCountRef = useRef(0)
  const authVersionRef = useRef(0)
  const authenticatedAtRef = useRef(0)

  const setAuthenticatedUser = useCallback((authenticatedUser: AuthUser) => {
    authVersionRef.current += 1
    authenticatedAtRef.current = Date.now()
    setUser(authenticatedUser)
    setIsLoading(false)
  }, [])

  const fetchUser = useCallback(async (options?: { silent?: boolean }) => {
    // In bypass mode, always use mock user
    if (isBypassMode) {
      setUser(DEV_MOCK_USER);
      setIsLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (fetchingRef.current) {
      if (options?.silent) pendingSilentFetchRef.current = true
      return
    }
    fetchingRef.current = true
    const requestAuthVersion = authVersionRef.current

    let retryScheduled = false
    try {
      if (!options?.silent) setIsLoading(true);
      const res = await moneaClient.get<{ user?: AuthUser } | AuthUser>('/api/auth/me');
      if (requestAuthVersion !== authVersionRef.current) return;

      // Handle successful response
      if (res.data && res.status === 200) {
        const userObj = (res.data as any)?.user || ((res.data as any)?.id ? (res.data as AuthUser) : null);
        if (userObj) {
          setUser(userObj);
          retryCountRef.current = 0;
          setIsLoading(false);
          return;
        }
      }

      // Handle 428 - Platform Owner 2FA setup required
      // This is expected for platform owners; redirect to 2FA setup flow
      if (res.status === 428) {
        console.log('[Auth] Platform Owner 2FA setup required (428)');
        // Dispatch event to show 2FA setup modal, but don't clear user session
        window.dispatchEvent(new CustomEvent('monea:2fa-setup-required', { 
          detail: { code: res.code, error: res.error }
        }));
        setIsLoading(false);
        retryCountRef.current = 0;
        return;
      }

      // Handle 401 - user not authenticated (normal case)  
      if (res.status === 401) {
        setUser(null);
        retryCountRef.current = 0;  // Reset retry counter on 401
        setIsLoading(false);
        return;
      }

      if (res.status >= 500) {
        if (retryCountRef.current < 1) {
          retryCountRef.current++;
          retryScheduled = true
          setTimeout(() => {
            fetchingRef.current = false;
            fetchUser();
          }, 2000);
        } else {
          setIsLoading(false);
        }
        return;
      }

      // Default: clear user
      setUser(null);
      setIsLoading(false);
    } catch (error) {
      console.warn('[Auth] Auth fetch failed:', error);
      setIsLoading(false);
    } finally {
      if (!retryScheduled) {
        setIsLoading(false);
        fetchingRef.current = false;
        if (pendingSilentFetchRef.current) {
          pendingSilentFetchRef.current = false
          // Only retry if we're not on a public path
          const publicPaths = ['/', '/templates', '/contact', '/support', '/privacy-policy', '/terms-and-conditions', '/khmer-digital-wedding-invitation'];
          if (!publicPaths.includes(window.location.pathname)) {
            setTimeout(() => { void fetchUser({ silent: true }) }, 5000);  // Longer delay to prevent spam
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBypassMode])

  useEffect(() => {
    const handleAuthExpired = (event: Event) => {
      const requestStartedAt = (event as CustomEvent<{ requestStartedAt?: number }>).detail?.requestStartedAt
      if (requestStartedAt && requestStartedAt <= authenticatedAtRef.current) return
      authVersionRef.current += 1
      authenticatedAtRef.current = 0
      setUser(null);
      setIsLoading(false);
    };
    window.addEventListener('monea:auth-expired', handleAuthExpired);

    if (isBypassMode) return () => window.removeEventListener('monea:auth-expired', handleAuthExpired); // Skip fetch in bypass mode
    const publicPaths = ['/', '/templates', '/contact', '/support', '/privacy-policy', '/terms-and-conditions', '/khmer-digital-wedding-invitation'];
    if (publicPaths.includes(window.location.pathname)) {
      setIsLoading(false);
      return () => window.removeEventListener('monea:auth-expired', handleAuthExpired);
    }
    // Debounce initial fetch for mobile
    const timer = setTimeout(fetchUser, 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('monea:auth-expired', handleAuthExpired);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Mount-only fetch with debounce to prevent loops

  const logout = useCallback(async () => {
    window.dispatchEvent(new CustomEvent('monea:auth-expired'));
    setUser(null);
    
    // Clear stored token
    try {
      sessionStorage.removeItem('auth_token');
    } catch (e) {
      console.warn('[Auth] Could not clear auth_token from sessionStorage:', e);
    }
    
    try {
      await moneaClient.post('/api/auth/logout');
    } catch (e) {
      console.warn('[Auth] Logout error:', e);
    }
    window.location.href = '/sign-in';
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refetch: fetchUser, setAuthenticatedUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
