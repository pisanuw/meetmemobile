import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getMe, logout as apiLogout } from '../api/auth';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  /** Re-fetch /api/auth/me and update user state. */
  refreshUser: () => Promise<void>;
  /** Log out and clear user state. */
  logout: () => Promise<void>;
  /** Called after successful WebView auth to re-hydrate state. */
  onAuthSuccess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch (err: unknown) {
      // getMe() returns null on 401 — if we get here it's a network/server error.
      // Don't clear an existing session for transient failures; leave user logged in.
      // The error will surface to callers (e.g. profile save) which handle it.
      throw err;
    }
  }, []);

  // Bootstrap: check if we have an active session on mount.
  // Unlike the exported refreshUser, we silently ignore errors here so a
  // transient network failure at startup doesn't prevent the app from opening.
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const me = await getMe();
        setUser(me);
      } catch {
        // Network/server error at boot — stay logged-out rather than crashing.
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore errors — clear state regardless
    }
    setUser(null);
  }, []);

  const onAuthSuccess = useCallback(async () => {
    await refreshUser();
  }, [refreshUser]);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    refreshUser,
    logout,
    onAuthSuccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
