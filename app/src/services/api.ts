import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Dynamic API URL depending on the platform environment
// Android emulator maps 10.0.2.2 to local host, iOS and Web use localhost/127.0.0.1
const getBaseUrl = () => {
  // Use host machine's local network IP to allow connections from physical devices
  return 'http://192.168.1.7:5001/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Authorization token automatically
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('pt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('API: Failed to fetch JWT token from secure store', err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Callback to notify AuthContext to update its React state on 401
let onUnauthorizedCallback: (() => void) | null = null;

export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

// Global response interceptor for handling 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.log('API: JWT token unauthorized or expired, clearing session.');
      try {
        await SecureStore.deleteItemAsync('pt_token');
        await SecureStore.deleteItemAsync('pt_user');
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
      } catch (err) {
        console.error('API: Error clearing unauthorized session:', err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
