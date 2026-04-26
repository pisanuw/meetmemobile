import { sendMagicLink, getMe, logout, updateProfile, submitFeedback } from '@/api/auth';
import { ApiClientError } from '@/api/client';

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

const MOCK_USER = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice',
  timezone: 'America/New_York',
  hasGoogleCalendar: false,
  isAdmin: false,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('sendMagicLink()', () => {
  it('posts to /api/auth/send-magic-link with email', async () => {
    mockPost.mockResolvedValue({ message: 'sent' });
    const result = await sendMagicLink('alice@example.com');
    expect(mockPost).toHaveBeenCalledWith('/api/auth/send-magic-link', {
      email: 'alice@example.com',
    });
    expect(result.message).toBe('sent');
  });

  it('propagates errors from the client', async () => {
    mockPost.mockRejectedValue(new Error('Rate limited'));
    await expect(sendMagicLink('alice@example.com')).rejects.toThrow('Rate limited');
  });
});

describe('getMe()', () => {
  it('returns the user when authenticated', async () => {
    mockGet.mockResolvedValue({ user: MOCK_USER });
    const user = await getMe();
    expect(user).toEqual(MOCK_USER);
    expect(mockGet).toHaveBeenCalledWith('/api/auth/me');
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
  it('posts profile update and returns updated user', async () => {
    const updated = { ...MOCK_USER, name: 'Alice B.' };
    mockPost.mockResolvedValue({ user: updated });
    const result = await updateProfile({ name: 'Alice B.', timezone: 'UTC' });
    expect(result.name).toBe('Alice B.');
    expect(mockPost).toHaveBeenCalledWith('/api/auth/profile', {
      name: 'Alice B.',
      timezone: 'UTC',
    });
  });
});

describe('submitFeedback()', () => {
  it('posts feedback correctly', async () => {
    mockPost.mockResolvedValue(undefined);
    await submitFeedback('Great app!', 'feature');
    expect(mockPost).toHaveBeenCalledWith('/api/auth/feedback', {
      message: 'Great app!',
      type: 'feature',
    });
  });
});
