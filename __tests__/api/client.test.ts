import { get, post, patch, del, ApiClientError } from '@/api/client';

// ---------- Helpers ----------

function mockFetch(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response);
}

function mockFetchError(message: string) {
  global.fetch = jest.fn().mockRejectedValue(new Error(message));
}

afterEach(() => jest.resetAllMocks());

// ---------- Tests ----------

describe('API client', () => {
  describe('get()', () => {
    it('makes a GET request with credentials:include', async () => {
      mockFetch(200, { ok: true });
      await get('/api/test');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        }),
      );
    });

    it('returns parsed JSON on success', async () => {
      mockFetch(200, { user: { id: '1' } });
      const result = await get<{ user: { id: string } }>('/api/test');
      expect(result.user.id).toBe('1');
    });

    it('throws ApiClientError on 401', async () => {
      mockFetch(401, { error: 'Unauthorized' });
      await expect(get('/api/test')).rejects.toBeInstanceOf(ApiClientError);
    });

    it('includes correct status on error', async () => {
      mockFetch(404, { error: 'Not found' });
      try {
        await get('/api/test');
      } catch (err) {
        expect((err as ApiClientError).status).toBe(404);
        expect((err as ApiClientError).body.error).toBe('Not found');
      }
    });

    it('handles non-JSON error body gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new SyntaxError('bad json')),
      } as unknown as Response);

      await expect(get('/api/test')).rejects.toBeInstanceOf(ApiClientError);
    });

    it('propagates network errors', async () => {
      mockFetchError('Network request failed');
      await expect(get('/api/test')).rejects.toThrow('Network request failed');
    });
  });

  describe('post()', () => {
    it('sends body as JSON string', async () => {
      mockFetch(200, {});
      await post('/api/test', { foo: 'bar' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ foo: 'bar' }),
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      );
    });

    it('sends POST with no body when payload is undefined', async () => {
      mockFetch(200, {});
      await post('/api/test');

      const call = (fetch as jest.Mock).mock.calls[0][1];
      expect(call.body).toBeUndefined();
    });

    it('handles 204 No Content', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: jest.fn(),
      } as unknown as Response);

      const result = await post('/api/logout');
      expect(result).toBeUndefined();
    });
  });

  describe('del()', () => {
    it('sends DELETE request', async () => {
      mockFetch(200, {});
      await del('/api/meetings/123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/meetings/123'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('patch()', () => {
    it('sends PATCH request with body', async () => {
      mockFetch(200, {});
      await patch('/api/profile', { name: 'Alice' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ name: 'Alice' }),
        }),
      );
    });
  });

  describe('ApiClientError', () => {
    it('has correct name, message, status and body', () => {
      const err = new ApiClientError(403, { error: 'Forbidden', details: 'x' });
      expect(err.name).toBe('ApiClientError');
      expect(err.message).toBe('Forbidden');
      expect(err.status).toBe(403);
      expect(err.body.details).toBe('x');
    });

    it('falls back to HTTP status message when error field is null-ish', () => {
      const err = new ApiClientError(500, { error: null as unknown as string });
      // null/undefined triggers ?? fallback; empty string does not
      expect(err.message).toBe('HTTP 500');
    });

    it('uses empty string message when error field is empty string', () => {
      const err = new ApiClientError(500, { error: '' });
      // ?? only falls back for null/undefined, not ''
      expect(err.message).toBe('');
    });
  });
});
