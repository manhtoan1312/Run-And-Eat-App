import axios from 'axios';
import { Config } from '../constants/Config';
import { getToken, useAuthStore } from '../store/useAuthStore';

const api = axios.create({
  baseURL: Config.API_URL,
});

// Centralized interceptor for authentication (Request)
api.interceptors.request.use(async (config) => {
  const token = await getToken('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid refreshing for the login/refresh endpoints themselves
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, add this request to the queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Check if we have a refresh token before embarking on refresh
      const { refreshToken, logout } = useAuthStore.getState();
      const rt = refreshToken || (await getToken('refreshToken'));

      if (!rt) {
        console.log('No refresh token available, logging out...');
        await logout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('Refreshing token...');
        const response = await axios.post(`${Config.API_URL}/auth/refresh`, {
          refreshToken: rt,
        });

        const { accessToken: newAt, refreshToken: newRt } = response.data.data;
        
        // Update store and SecureStore
        await useAuthStore.getState().saveTokens(newAt, newRt);

        // Process all queued requests with the new token
        processQueue(null, newAt);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAt}`;
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error('Refresh token failed:', refreshError?.response?.data || refreshError.message);
        processQueue(refreshError, null);
        
        // Logout if refresh fails
        await useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
