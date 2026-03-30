import { get, post } from './client';
import { User, ProfileUpdatePayload } from '../types';

export interface MagicLinkResponse {
  message: string;
}

export interface MeResponse {
  user: User;
}

/**
 * Request a magic-link email. The backend sends an email containing a link
 * that, when visited (in the in-app WebView), sets the auth cookie.
 */
export async function sendMagicLink(email: string): Promise<MagicLinkResponse> {
  return post<MagicLinkResponse>('/api/auth/send-magic-link', { email });
}

/**
 * Fetch the currently authenticated user. Returns null if not authenticated.
 */
export async function getMe(): Promise<User | null> {
  try {
    const { user } = await get<MeResponse>('/api/auth/me');
    return user;
  } catch (err: unknown) {
    // 401 → not authenticated
    if (err instanceof Error && 'status' in err && (err as { status: number }).status === 401) {
      return null;
    }
    throw err;
  }
}

/**
 * Log out — clears the session cookie on the server.
 */
export async function logout(): Promise<void> {
  return post<void>('/api/auth/logout');
}

/**
 * Update profile fields (name, timezone).
 */
export async function updateProfile(payload: ProfileUpdatePayload): Promise<User> {
  const { user } = await post<MeResponse>('/api/auth/profile', payload);
  return user;
}

/**
 * Submit user feedback.
 */
export async function submitFeedback(message: string, type: 'bug' | 'feature' | 'other'): Promise<void> {
  return post<void>('/api/auth/feedback', { message, type });
}
