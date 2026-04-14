import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession
} from '../services/sessionStorage';
import { AUTH_EXPIRED_EVENT } from '../services/httpClient';
import { deduplicatedFetch } from '../utils/requestDeduplicator';

const AuthContext = createContext(null);

const emptySession = {
  user: null,
  accessToken: null,
  refreshToken: null
};

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(() => getStoredSession() || emptySession);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  const persistSession = useCallback((nextSession) => {
    setSessionState(nextSession);

    if (nextSession?.accessToken) {
      setStoredSession(nextSession);
      return;
    }

    clearStoredSession();
  }, []);

  const clearSession = useCallback(() => {
    persistSession(emptySession);
  }, [persistSession]);

  useEffect(() => {
    let mounted = true;

    async function bootstrapSession() {
      const storedSession = getStoredSession();

      if (!storedSession?.accessToken) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        // deduplicatedFetch garantiza 1 sola llamada aunque StrictMode duplique el efecto
        const response = await deduplicatedFetch('auth:bootstrap:validate', () =>
          authService.validate()
        );

        if (mounted) {
          persistSession({
            ...storedSession,
            user: response.user
          });
        }
      } catch {
        // Access token expired — try silent refresh
        if (storedSession.refreshToken) {
          try {
            const refreshed = await deduplicatedFetch('auth:bootstrap:refresh', () =>
              authService.refresh(storedSession.refreshToken)
            );

            if (mounted) {
              persistSession({
                user: refreshed.user || storedSession.user,
                accessToken: refreshed.accessToken,
                refreshToken: refreshed.refreshToken
              });
            }
          } catch {
            if (mounted) {
              clearSession();
            }
          }
        } else if (mounted) {
          clearSession();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrapSession();

    return () => {
      mounted = false;
    };
  }, [clearSession, persistSession]);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearSession();
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [clearSession]);

  const value = useMemo(
    () => ({
      session,
      user: session.user,
      loading,
      authenticating,
      isAuthenticated: Boolean(session.accessToken),
      async login(credentials) {
        setAuthenticating(true);

        try {
          const response = await authService.login(credentials);
          const nextSession = {
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken
          };

          persistSession(nextSession);
          return response;
        } finally {
          setAuthenticating(false);
        }
      },
      logout() {
        const currentSession = getStoredSession();
        clearSession();
        if (currentSession?.refreshToken) {
          authService.logout(currentSession.refreshToken);
        }
      },
      async refreshProfile() {
        const response = await authService.profile();
        const nextSession = {
          ...session,
          user: response.user
        };
        persistSession(nextSession);
        return response.user;
      },
      async changePassword(payload) {
        return authService.changePassword(payload);
      }
    }),
    [authenticating, clearSession, loading, session, persistSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
