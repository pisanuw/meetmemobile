import { get, post } from './client';
import { User, ProfileUpdatePayload } from '../types';

export interface MagicLinkResponse {
  message: string;
}

// Raw shape returned by GET /api/auth/me
interface RawMeResponse {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
}

/**
 * Request a magic-link email.
 * Backend endpoint: POST /api/auth/magic-link/request
 */
export async function sendMagicLink(email: string): Promise<MagicLinkResponse> {
  return post<MagicLinkResponse>('/api/auth/magic-link/request', { email, name: '' });
}

/**
 * Fetch the currently authenticated user. Returns null if not authenticated.
 * Backend returns a flat object; we map is_admin → isAdmin.
 */
export async function getMe(): Promise<User | null> {
  try {
    const raw = await get<RawMeResponse>('/api/auth/me');
    return {
      id: raw.id,
      email: raw.email,
      name: raw.name,
      isAdmin: raw.is_admin,
    };
  } catch (err: unknown) {
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
 * Backend expects first_name / last_name separately; we split on the first space.
 */
export async function updateProfile(payload: ProfileUpdatePayload): Promise<void> {
  const parts = (payload.name ?? '').trim().split(/\s+/);
  const first_name = parts[0] ?? '';
  const last_name = parts.slice(1).join(' ');
  await post<unknown>('/api/auth/profile', {
    first_name,
    last_name,
    timezone: payload.timezone,
  });
}

/**
 * Submit user feedback.
 * Backend requires the sender's email in the body (no auth check on this endpoint).
 */
export async function submitFeedback(
  message: string,
  type: 'bug' | 'feature' | 'other',
  email: string,
): Promise<void> {
  return post<void>('/api/auth/feedback', { name: '', email, type, message });
}
