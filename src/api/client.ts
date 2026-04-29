/**
 * API client for MeetMe backend.
 *
 * Authentication strategy:
 *  - Web / WKWebView (magic-link): relies on the HttpOnly `token` cookie which
 *    WKWebView writes to NSHTTPCookieStorage.shared (sharedCookiesEnabled=true).
 *  - iOS native Google OAuth: ASWebAuthenticationSession cookies do NOT reach
 *    URLSession. Instead, the JWT token is extracted from the meetme:// callback
 *    URL and stored in SecureStore. We read it here and send it as Bearer.
 *
 * Web requests from WKWebView still use credentials:'include' so both paths work.
 */

import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config';
import { ApiError } from '../types';

export const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Persist an auth token (JWT) received from a native OAuth redirect.
 * Call this after extracting the token from the meetme:// callback URL.
 */
export async function storeAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

/**
 * Clear the stored auth token (on logout).
 */
export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError,
  ) {
    super(body.error ?? `HTTP ${status}`);
    this.name = 'ApiClientError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  // Read the stored JWT (set after native Google OAuth) and send it as Bearer.
  // If absent, fall back to cookie-based auth (magic-link / WKWebView flows).
  const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // send & receive cookies
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let body: ApiError = { error: `HTTP ${response.status}` };
    try {
      body = await response.json();
    } catch {
      // non-JSON error body; use default
    }
    throw new ApiClientError(response.status, body);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

// Convenience wrappers

export function get<T>(path: string, headers?: HeadersInit): Promise<T> {
  return request<T>(path, { method: 'GET', headers });
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}
