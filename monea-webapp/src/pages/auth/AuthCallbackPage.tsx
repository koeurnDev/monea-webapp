import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { getApiUrl } from '@/lib/api-url';
import { moneaClient } from '@/lib/api-client';
import { getPostLoginPath } from '@/lib/auth-navigation';
import { ROLES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import type { AuthUser } from '@/types/auth';

type CallbackUser = Partial<AuthUser> & {
  id?: string;
  userId?: string;
  role?: string;
  type?: string;
};

type CallbackProfile = CallbackUser & { user?: CallbackUser };

/**
 * AuthCallbackPage — exchanges a short-lived SSO ticket for an HttpOnly session cookie,
 * then redirects to the dashboard.
 */
export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    const error = searchParams.get('error');
    window.history.replaceState(null, "", window.location.pathname);

    if (error) {
      navigate(`/sign-in?error=${error}`, { replace: true });
      return;
    }

    if (searchParams.has('token')) {
      navigate('/sign-in?error=invalid_sso_session', { replace: true });
      return;
    }

    if (!code) {
      navigate('/sign-in?error=no_code', { replace: true });
      return;
    }

    // Fallback: Exchange the one-time code for a session cookie via the backend
    console.log('[Auth Callback] Exchanging code for session...');
    fetch(getApiUrl('api/auth/session'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        console.log('[Auth Callback] Session exchange response status:', res.status);
        const text = await res.text();
        console.log('[Auth Callback] Session exchange response body:', text);
        
        if (res.ok) {
          let data = null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch (e) {
            console.error('[Auth Callback] JSON parse error:', e);
            navigate('/sign-in?error=invalid_response', { replace: true });
            return;
          }
          if (data?.success || data?.ok) {
            if (data?.token) {
              try {
                sessionStorage.setItem('auth_token', data.token);
                console.log('[Auth Callback] Token stored in sessionStorage');
              } catch (e) {
                console.warn('[Auth Callback] Could not store auth_token in sessionStorage:', e);
              }
            }
            const profile = await moneaClient.get<CallbackProfile>('/api/auth/me');
            
            // Handle 428 - Platform Owner needs 2FA setup
            if (profile.status === 428) {
              console.log('[Auth Callback] Platform Owner 2FA setup required (428)');
              navigate('/sign-in?error=owner_mfa_setup_required', { replace: true });
              return;
            }
            
            const callbackUser = profile.data?.user || profile.data;
            const id = callbackUser?.userId || callbackUser?.id;
            if (profile.error || !callbackUser || !id || !callbackUser.role) {
              console.error('[Auth Callback] Failed to load authenticated profile:', profile.error || 'Invalid user profile');
              navigate('/sign-in?error=session_failed', { replace: true });
              return;
            }

            const role = callbackUser.role;
            setAuthenticatedUser({
              ...callbackUser,
              id,
              userId: id,
              email: callbackUser.email || '',
              name: callbackUser.name ?? null,
              role,
              type: role === ROLES.EVENT_STAFF
                ? 'staff'
                : role === ROLES.PLATFORM_OWNER
                  ? 'admin'
                  : callbackUser.type === 'admin'
                    ? 'admin'
                    : 'user',
            });
            navigate(getPostLoginPath(role === ROLES.PLATFORM_OWNER, null, window.location.origin), { replace: true });
          } else {
            console.error('[Auth Callback] Session exchange response was incomplete');
            navigate('/sign-in?error=invalid_response', { replace: true });
          }
        } else {
          console.error('[Auth Callback] Session exchange failed:', res.status);
          navigate('/sign-in?error=session_failed', { replace: true });
        }
      })
      .catch((err) => {
        console.error('[Auth Callback] Network error:', err);
        navigate('/sign-in?error=network_error', { replace: true });
      });
  }, [searchParams, navigate, setAuthenticatedUser]);

  return <LoadingScreen />;
}
