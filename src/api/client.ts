/**
 * API client for MeetMe backend.
 *
 * The backend authenticates via an HttpOnly JWT cookie named `session`.
 * On iOS, React Native's native fetch uses URLSession which honours the
 * shared iOS cookie store, so cookies set during the magic-link WebView
 * flow are automatically included in subsequent fetch calls made here.
 *
 * We always send `credentials: 'include'` to ensure cookies flow.
 */

import { API_BASE_URL } from '../config';
import { ApiError } from '../types';

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

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // send & receive cookies
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
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
