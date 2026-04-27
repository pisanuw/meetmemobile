import { sendMagicLink, getMe, logout, updateProfile, submitFeedback } from '@/api/auth';

// Mock the client module
jest.mock('@/api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  ApiClientError: class MockApiClientError extends Error {
    status: number;
    body: { error: string };
    constructor(status: number, body: { error: string }) {
      super(body.error);
      this.status = status;
      this.body = body;
    }
  },
}));

import * as client from '@/api/client';

const mockGet = client.get as jest.Mock;
const mockPost = client.post as jest.Mock;

afterEach(() => jest.resetAllMocks());

// Raw shape returned by /api/auth/me (flat, snake_case)
const RAW_ME = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice Smith',
  is_admin: false,
};

describe('sendMagicLink()', () => {
  it('posts to /api/auth/magic-link/request with email and empty name', async () => {
    mockPost.mockResolvedValue({ message: 'sent' });
    const result = await sendMagicLink('alice@example.com');
    expect(mockPost).toHaveBeenCalledWith('/api/auth/magic-link/request', {
      email: 'alice@example.com',
      name: '',
    });
    expect(result.message).toBe('sent');
  });

  it('propagates errors from the client', async () => {
    mockPost.mockRejectedValue(new Error('Rate limited'));
    await expect(sendMagicLink('alice@example.com')).rejects.toThrow('Rate limited');
  });
});

describe('getMe()', () => {
  it('maps flat backend response to User with camelCase fields', async () => {
    mockGet.mockResolvedValue(RAW_ME);
    const user = await getMe();
    expect(user).toEqual({
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice Smith',
      isAdmin: false,
    });
    expect(mockGet).toHaveBeenCalledWith('/api/auth/me');
  });

  it('maps is_admin: true to isAdmin: true', async () => {
    mockGet.mockResolvedValue({ ...RAW_ME, is_admin: true });
    const user = await getMe();
    expect(user?.isAdmin).toBe(true);
  });

  it('returns null on 401 (not authenticated)', async () => {
    const err = new (client.ApiClientError as unknown as new (s: number, b: { error: string }) => Error)(401, { error: 'Unauthorized' });
    mockGet.mockRejectedValue(err);
    const user = await getMe();
    expect(user).toBeNull();
  });

  it('re-throws non-auth errors', async () => {
    const err = new (client.ApiClientError as unknown as new (s: number, b: { error: string }) => Error)(500, { error: 'Server error' });
    mockGet.mockRejectedValue(err);
    await expect(getMe()).rejects.toThrow('Server error');
  });
});

describe('logout()', () => {
  it('posts to /api/auth/logout', async () => {
    mockPost.mockResolvedValue(undefined);
    await logout();
    expect(mockPost).toHaveBeenCalledWith('/api/auth/logout');
  });
});

describe('updateProfile()', () => {
  it('splits name into first_name / last_name for backend', async () => {
    mockPost.mockResolvedValue({ success: true, name: 'Alice B.' });
    await updateProfile({ name: 'Alice B.', timezone: 'UTC' });
    expect(mockPost).toHaveBeenCalledWith('/api/auth/profile', {
      first_name: 'Alice',
      last_name: 'B.',
      timezone: 'UTC',
    });
  });

  it('handles single-word name (no last name)', async () => {
    mockPost.mockResolvedValue({ success: true, name: 'Alice' });
    await updateProfile({ name: 'Alice', timezone: 'UTC' });
    expect(mockPost).toHaveBeenCalledWith('/api/auth/profile', {
      first_name: 'Alice',
      last_name: '',
      timezone: 'UTC',
    });
  });
});

describe('submitFeedback()', () => {
  it('posts feedback with email, name, type, and message', async () => {
    mockPost.mockResolvedValue(undefined);
    await submitFeedback('Great app!', 'feature', 'alice@example.com');
    expect(mockPost).toHaveBeenCalledWith('/api/auth/feedback', {
      name: '',
      email: 'alice@example.com',
      type: 'feature',
      message: 'Great app!',
    });
  });
});
