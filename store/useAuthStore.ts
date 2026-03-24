import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const getToken = async (key: string) => {
  if (isWeb) return localStorage.getItem(key);
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
};

export const setTokenSecure = async (key: string, value: string) => {
  if (isWeb) {
    localStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.warn(`Failed to save ${key} to SecureStore`, e);
  }
};

export const removeToken = async (key: string) => {
  if (isWeb) {
    localStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}
};

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  setToken: (accessToken: string | null, refreshToken: string | null) => void;
  saveTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loadTokens: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  loading: true,

  setToken: (accessToken, refreshToken) => set({ accessToken, refreshToken, loading: false }),

  saveTokens: async (accessToken: string, refreshToken: string) => {
    await setTokenSecure('accessToken', accessToken);
    await setTokenSecure('refreshToken', refreshToken);
    set({ accessToken, refreshToken, loading: false });
  },

  logout: async () => {
    await removeToken('accessToken');
    await removeToken('refreshToken');
    set({ accessToken: null, refreshToken: null, loading: false });
  },

  loadTokens: async () => {
    const at = await getToken('accessToken');
    const rt = await getToken('refreshToken');
    set({ accessToken: at, refreshToken: rt, loading: false });
  },
}));
