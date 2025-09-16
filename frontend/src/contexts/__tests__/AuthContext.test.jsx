import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import authService from '../../services/authService';

// Mock the auth service
jest.mock('../../services/authService');

describe('AuthContext', () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    authService.isAuthenticated.mockReturnValue(false);
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const { result } = renderHook(() => {
        try {
          return useAuth();
        } catch (error) {
          return { error: error.message };
        }
      });

      expect(result.current.error).toBe('useAuth must be used within an AuthProvider');
    });

    it('should provide auth context values', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toHaveProperty('user', null);
      expect(result.current).toHaveProperty('loading', false);
      expect(result.current).toHaveProperty('error', null);
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('register');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('isAuthenticated', false);
      expect(result.current).toHaveProperty('isLibrarian');
      expect(result.current).toHaveProperty('isMember');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@library.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'member'
      };

      authService.login.mockResolvedValue({ user: mockUser, token: 'token' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.login('test@library.com', 'password');
        expect(response.success).toBe(true);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(authService.login).toHaveBeenCalledWith('test@library.com', 'password');
    });

    it('should handle login error', async () => {
      const errorMessage = 'Invalid credentials';
      authService.login.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.login('test@library.com', 'wrong');
        expect(response.success).toBe(false);
        expect(response.error).toBe(errorMessage);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const userData = {
        email: 'new@library.com',
        password: 'SecurePass123!',
        first_name: 'New',
        last_name: 'User',
        role: 'member'
      };

      const mockUser = { id: 'user-123', ...userData };
      authService.register.mockResolvedValue({ user: mockUser, token: 'token' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.register(userData);
        expect(response.success).toBe(true);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(authService.register).toHaveBeenCalledWith(userData);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      authService.logout.mockResolvedValue();

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set initial user
      await act(async () => {
        result.current.user = { id: 'user-123', role: 'member' };
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBe(null);
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('role checks', () => {
    it('should correctly identify librarian role', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.user = { id: 'user-123', role: 'librarian' };
      });

      expect(result.current.isLibrarian()).toBe(true);
      expect(result.current.isMember()).toBe(false);
    });

    it('should correctly identify member role', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.user = { id: 'user-123', role: 'member' };
      });

      expect(result.current.isLibrarian()).toBe(false);
      expect(result.current.isMember()).toBe(true);
    });
  });

  describe('initialization', () => {
    it('should load current user on mount if authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@library.com',
        role: 'member'
      };

      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toEqual(mockUser);
      expect(authService.getCurrentUser).toHaveBeenCalled();
    });

    it('should handle initialization error', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });
});