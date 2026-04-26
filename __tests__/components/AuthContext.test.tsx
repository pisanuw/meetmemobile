import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Mock API module
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
  describe('initial bootstrap', () => {
    it('starts with isLoading true and no user', async () => {
      let resolveMe!: (v: typeof MOCK_USER | null) => void;
      mockGetMe.mockReturnValue(new Promise(r => { resolveMe = r; }));

      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      await act(async () => { resolveMe(null); });
    });

    it('sets user when getMe returns a user', async () => {
      mockGetMe.mockResolvedValue(MOCK_USER);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      expect(result.current.user).toEqual(MOCK_USER);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('sets user to null and isAuthenticated false when getMe returns null', async () => {
      mockGetMe.mockResolvedValue(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('sets user to null when getMe throws', async () => {
      mockGetMe.mockRejectedValue(new Error('Network failure'));
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout()', () => {
    it('calls logout API and clears user', async () => {
      mockGetMe.mockResolvedValue(MOCK_USER);
      mockLogout.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('clears user even when logout API throws', async () => {
      mockGetMe.mockResolvedValue(MOCK_USER);
      mockLogout.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('refreshUser()', () => {
    it('re-fetches user and updates state', async () => {
      mockGetMe
        .mockResolvedValueOnce(MOCK_USER)         // initial bootstrap
        .mockResolvedValueOnce({ ...MOCK_USER, name: 'Alice B.' }); // refresh

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      expect(result.current.user?.name).toBe('Alice');

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user?.name).toBe('Alice B.');
    });
  });

  describe('onAuthSuccess()', () => {
    it('re-fetches user after successful auth', async () => {
      mockGetMe
        .mockResolvedValueOnce(null)       // initial: not authenticated
        .mockResolvedValueOnce(MOCK_USER); // after auth: user returned

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      expect(result.current.isAuthenticated).toBe(false);

      await act(async () => {
        await result.current.onAuthSuccess();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(MOCK_USER);
    });
  });

  describe('useAuth() outside provider', () => {
    it('throws when used outside AuthProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within <AuthProvider>');
      consoleError.mockRestore();
    });
  });
});
