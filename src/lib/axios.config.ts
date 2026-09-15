import { tokenStore } from '@/auth/services/token-store';
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

/**
 * Base API URL configured from environment variable or default backend port 3000
 */
export const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Axios Client instance configured for INJ Admin Backend
 * withCredentials: true ensures httpOnly refresh cookie is sent automatically.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Callbacks for coordination with React Auth State
let onAuthFailureCallback: (() => void) | null = null;
let onRefreshSuccessCallback:
  | ((accessToken: string, expiresIn: number) => void)
  | null = null;

export const setAuthCallbacks = (callbacks: {
  onAuthFailure?: () => void;
  onRefreshSuccess?: (accessToken: string, expiresIn: number) => void;
}) => {
  if (callbacks.onAuthFailure !== undefined) {
    onAuthFailureCallback = callbacks.onAuthFailure;
  }
  if (callbacks.onRefreshSuccess !== undefined) {
    onRefreshSuccessCallback = callbacks.onRefreshSuccess;
  }
};

// Request Interceptor: Attach in-memory access token dynamically at request time
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Single-Flight Refresh Promise to prevent race conditions and token reuse
 */
let refreshingPromise: Promise<string> | null = null;

export const refreshTokensSingleFlight = (): Promise<string> => {
  if (!refreshingPromise) {
    refreshingPromise = (async () => {
      try {
        const response = await axios.post<{
          accessToken: string;
          expiresIn: number;
        }>(
          `${API_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        );

        const { accessToken, expiresIn } = response.data;
        tokenStore.setAccessToken(accessToken);

        if (onRefreshSuccessCallback) {
          onRefreshSuccessCallback(accessToken, expiresIn);
        }

        return accessToken;
      } catch (error) {
        tokenStore.clear();
        if (onAuthFailureCallback) {
          onAuthFailureCallback();
        }
        throw error;
      } finally {
        refreshingPromise = null;
      }
    })();
  }

  return refreshingPromise;
};

// Custom interface for request retry flag
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Response Interceptor: Centralized error handling & single-flight 401 retry
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (
    error: AxiosError<{ message?: string | string[]; [key: string]: any }>,
  ) => {
    const originalRequest = error.config as CustomRequestConfig | undefined;

    if (error.response) {
      const { status, data, headers } = error.response;
      const requestId = headers?.['x-request-id'];

      // Log server errors with Request ID
      if (status >= 500) {
        console.error(
          `[API 500 Server Error] [Request-ID: ${requestId || 'N/A'}]`,
          data?.message || error.message,
        );
      }

      // Handle 401 Unauthorized
      if (status === 401 && originalRequest) {
        const requestUrl = originalRequest.url || '';

        // If 401 happens on refresh or login endpoint, DO NOT retry to avoid infinite loop
        if (
          requestUrl.includes('/auth/refresh') ||
          requestUrl.includes('/auth/login')
        ) {
          tokenStore.clear();
          if (onAuthFailureCallback) {
            onAuthFailureCallback();
          }
          return Promise.reject(error);
        }

        // Retry only once per request
        if (!originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await refreshTokensSingleFlight();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          } catch (refreshErr) {
            return Promise.reject(refreshErr);
          }
        }
      }

      // Handle 403 Forbidden: DO NOT REFRESH (as strictly instructed in PROMPT_FRONTEND.md)
      if (status === 403) {
        console.warn(
          'API Error (403): Insufficient permissions or account restricted.',
        );
      }

      // Handle 429 Rate Limit
      if (status === 429) {
        const retryAfter = headers?.['retry-after'];
        console.warn(
          `API Error (429): Too many requests. Retry-After: ${retryAfter || 'N/A'}`,
        );
      }
    }

    return Promise.reject(error);
  },
);

// Convenient helper methods wrapper
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res: AxiosResponse<T>) => res.data),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient
      .post<T>(url, data, config)
      .then((res: AxiosResponse<T>) => res.data),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient
      .put<T>(url, data, config)
      .then((res: AxiosResponse<T>) => res.data),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient
      .patch<T>(url, data, config)
      .then((res: AxiosResponse<T>) => res.data),
  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res: AxiosResponse<T>) => res.data),
};
