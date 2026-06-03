import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { tokenStorage } from '@/stores/token-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshTokenRequest: Promise<ApiResponse<{ accessToken: string; expiresIn: number }>> | null = null;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export async function refreshAccessTokenOnce(): Promise<ApiResponse<{ accessToken: string; expiresIn: number }>> {
  if (!refreshTokenRequest) {
    refreshTokenRequest = api
      .post<ApiResponse<{ accessToken: string; expiresIn: number }>>('/auth/refresh')
      .then((response) => {
        const refreshResponse = response.data;
        tokenStorage.setAccessToken(refreshResponse.data.accessToken);
        return refreshResponse;
      })
      .finally(() => {
        refreshTokenRequest = null;
      });
  }

  return refreshTokenRequest;
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');
    const requestTag = `${originalRequest.method?.toUpperCase() || 'GET'} ${originalRequest.url || 'unknown-url'}`;

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      console.log('[api][401][before-refresh]', requestTag, {
        retry: false,
        isRefreshing,
      });

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            console.log('[api][401][retry-after-refresh-queue]', requestTag);
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('[api][401][refresh-start]', requestTag);
        const response = await refreshAccessTokenOnce();
        const { accessToken } = response.data;

        console.log('[api][401][refresh-success]', requestTag, {
          newAccessTokenPresent: Boolean(accessToken),
        });

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        console.log('[api][401][retry-original-after-refresh]', requestTag);
        return api(originalRequest);
      } catch (refreshError) {
        console.log('[api][401][after-refresh-failed]', requestTag, refreshError);
        processQueue(refreshError as Error, null);
        tokenStorage.clearAccessToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
      if (typeof window !== 'undefined') {
        // window.location.href = '/not-found';
      }
    }

    if (error.response?.status === 404) {
      toast.error('Resource not found');
      if (typeof window !== 'undefined') {
        window.location.href = '/not-found';
      }
    }

    if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export function getApiUrl() {
  return API_URL;
}
