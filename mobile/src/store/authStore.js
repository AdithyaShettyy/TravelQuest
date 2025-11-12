import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: true,
  error: null,

  // Initialize auth from storage
  initAuth: async () => {
    try {
      // BYPASS LOGIN: Automatically set a mock user for testing
      const mockUser = {
        id: 'test-user-123',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        avatar: null,
        totalPoints: 1500,
        currentStreak: 7,
        longestStreak: 12,
        lastSubmissionDate: null,
        level: 5,
        role: 'user',
        isActive: true,
        preferences: {
          theme: 'light',
          privacy: 'public',
          notifications: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const mockToken = 'mock-jwt-token-for-testing';

      // Store mock data in AsyncStorage for consistency
      await AsyncStorage.setItem('token', mockToken);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));

      set({ user: mockUser, token: mockToken, isLoading: false });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isLoading: false });
    }
  },

  // Login
  login: async (email, password) => {
    try {
      set({ error: null, isLoading: true });
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      set({ user, token, isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Register
  register: async (userData) => {
    try {
      set({ error: null, isLoading: true });
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      set({ user, token, isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Logout
  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      set({ user: null, token: null });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Update user
  updateUser: async (updates) => {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
