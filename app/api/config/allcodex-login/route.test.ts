import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock, mockCookieJar } from '@/app/api/__test-helpers__/mock-next';
import { POST } from './route';

setupNextServerMock();

const mockCookies = mockCookieJar();

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookies),
}));

describe('/api/config/allcodex-login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('handles successful login and sets cookie', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ authToken: 'new-etapi-token' }),
      }) as any;

      const req = new MockNextRequest('http://localhost/api/config/allcodex-login', { method: 'POST', body: { url: 'http://loc:80', username: 'u', password: 'p' } }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(200);
      expect(mockCookies.set).toHaveBeenCalledWith('allcodex_url', 'http://loc:80', expect.any(Object));
      expect(mockCookies.set).toHaveBeenCalledWith('allcodex_token', 'new-etapi-token', expect.any(Object));
    });

    it('handles 401 login failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      }) as any;

      const req = new MockNextRequest('http://localhost/api/config/allcodex-login', { method: 'POST', body: { url: 'http://loc:80', username: 'u', password: 'p' } }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('returns 400 when missing fields', async () => {
      const req = new MockNextRequest('http://localhost/api/config/allcodex-login', { method: 'POST', body: {} }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(400);
    });
  });
});
