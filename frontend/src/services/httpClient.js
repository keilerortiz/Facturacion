import axios from 'axios';
import { clearStoredSession, getStoredSession, setStoredSession } from './sessionStorage';

export const AUTH_EXPIRED_EVENT = 'facturacion:auth-expired';
const resolvedApiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

const httpClient = axios.create({
  baseURL: resolvedApiBaseUrl,
  timeout: 15000
});

httpClient.interceptors.request.use((config) => {
  const session = getStoredSession();

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});

// --- Silent refresh logic ---
let refreshPromise = null;

function attemptTokenRefresh() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const session = getStoredSession();
    if (!session?.refreshToken) throw new Error('No refresh token');

    const { data } = await axios.post(
      `${resolvedApiBaseUrl}/auth/refresh`,
      { refreshToken: session.refreshToken },
      { timeout: 10000 }
    );

    const nextSession = {
      user: data.user || session.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken
    };
    setStoredSession(nextSession);
    return nextSession;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 for requests that haven't been retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest?.skipAuthRedirect &&
      !originalRequest?._retried
    ) {
      originalRequest._retried = true;

      try {
        const newSession = await attemptTokenRefresh();
        originalRequest.headers.Authorization = `Bearer ${newSession.accessToken}`;
        return httpClient(originalRequest);
      } catch {
        // Refresh failed — clear session and notify
      }
    }

    if (error.response?.status === 401 && !originalRequest?.skipAuthRedirect) {
      clearStoredSession();
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  }
);

export default httpClient;
