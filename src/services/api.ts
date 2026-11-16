import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '../store/authStore';
import { demoReadOnlyInterceptor } from './demoReadOnly';

const fallbackApiBaseUrl = Capacitor.isNativePlatform()
  ? 'https://daniel15k-api-production.up.railway.app'
  : 'http://localhost:3000';

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? fallbackApiBaseUrl;
export const api=axios.create({ baseURL: apiBaseUrl });
api.interceptors.request.use((config)=>{ const token=useAuthStore.getState().accessToken; if(token){ if(!config.headers) config.headers=new axios.AxiosHeaders(); config.headers.set('Authorization',`Bearer ${token}`); } return config; });

// ASC-4 fase 6: aviso global de solo lectura en el modo demo (403 demo_read_only).
api.interceptors.response.use((response) => response, demoReadOnlyInterceptor);

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const requestUrl = String(originalRequest?.url ?? '');
    const isAuthRefreshRequest = requestUrl.includes('/api/v1/auth/refresh');

    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthRefreshRequest) {
      return Promise.reject(error);
    }

    const { accessToken, user, refreshToken, clearSession, demoStash, exitDemoMode } = useAuthStore.getState();
    if (!accessToken || !user) {
      clearSession();
      return Promise.reject(error);
    }

    // ASC-4: la sesión demo no tiene refresh token. Al vencer, se vuelve a la sesión real guardada (si se entró
    // con el interruptor) o se cierra y la ruta protegida lleva a /login.
    if (user.demo) {
      if (demoStash) {
        exitDemoMode();
        window.location.assign('/profile');
      } else {
        clearSession();
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshToken().finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;

      const nextToken = useAuthStore.getState().accessToken;
      if (nextToken) {
        if (!originalRequest.headers) {
          originalRequest.headers = new axios.AxiosHeaders();
        }
        originalRequest.headers.set('Authorization', `Bearer ${nextToken}`);
      }

      return api(originalRequest);
    } catch (refreshError) {
      clearSession();
      return Promise.reject(refreshError);
    }
  },
);
