import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Mock auth API
jest.mock('@/api/auth', () => ({
  getMe: jest.fn(),
  logout: jest.fn(),
}));

import * as authApi from '@/api/auth';

const mockGetMe = authApi.getMe as jest.Mock;
const mockLogout = authApi.logout as jest.Mock;

const MOCK_USER = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice',
  timezone: 'UTC',
  hasGoogleCalendar: false,
  isAdmin: false,
  createdAt: '2024-01-01T00:00:00Z',
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

afterEach(() => jest.resetAllMocks());

describe('AuthContext', () => {
  describe('initial load', () => {
    it('starts with isLoading=true and user=null', async () => {
      mockGetMe.mockResolvedValue(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    it('sets user when getMe resolves with a user', async () => {
      mockGetMe.mockResolvedValue(MOCK_USER);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toEqual(MOCK_USER);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('leaves user null when getMe returns null (not authenticated)', async () => {
      mockGetMe.mockResolvedValue(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('handles getMe throwing (network error) gracefully', async () => {
      mockGetMe.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toBeNull();
    });
  });

  describe('logout()', () => {
    it('clears user state after logout', async () => {
      mockGetMe.mockResolvedValue(MOCK_USER);
      mockLogout.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('clears user even when logout API call throws', async () => {
      mockGetMe.mockResolvedValue(MOCK_USER);
      mockLogout.mockRejectedValue(new Error('Network'));
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('refreshUser()', () => {
    it('re-fetches user from API and updates state', async () => {
      mockGetMe.mockResolvedValueOnce(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toBeNull();

      // Now simulate successful auth
      mockGetMe.mockResolvedValue(MOCK_USER);
      await act(async () => {
        await result.current.refreshUser();
      });
      expect(result.current.user).toEqual(MOCK_USER);
    });
  });

  describe('onAuthSuccess()', () => {
    it('calls refreshUser to hydrate auth state post-WebView login', async () => {
      mockGetMe.mockResolvedValueOnce(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      mockGetMe.mockResolvedValue(MOCK_USER);
      await act(async () => {
        await result.current.onAuthSuccess();
      });
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('useAuth() guard', () => {
    it('throws when used outside AuthProvider', () => {
      // Suppress the expected console.error from React
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useAuth())).toThrow(
        'useAuth must be used within <AuthProvider>',
      );
      spy.mockRestore();
    });
  });
});
