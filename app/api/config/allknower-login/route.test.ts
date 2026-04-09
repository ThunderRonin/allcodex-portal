import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock, mockCookieJar } from '@/app/api/__test-helpers__/mock-next';
import { POST } from './route';

setupNextServerMock();

const mockCookies = mockCookieJar();

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookies),
}));

describe('/api/config/allknower-login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('handles successful login and sets cookie', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'new-ak-token' }),
      }) as any;

      const req = new MockNextRequest('http://localhost/api/config/allknower-login', { method: 'POST', body: { url: 'http://loc:30', email: 'u', password: 'p' } }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(200);
      expect(mockCookies.set).toHaveBeenCalledWith('allknower_url', 'http://loc:30', expect.any(Object));
      expect(mockCookies.set).toHaveBeenCalledWith('allknower_token', 'new-ak-token', expect.any(Object));
    });

    it('handles 401 login failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      }) as any;

      const req = new MockNextRequest('http://localhost/api/config/allknower-login', { method: 'POST', body: { url: 'http://loc:30', email: 'u', password: 'p' } }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('handles missing token in response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}), // no token
      }) as any;

      const req = new MockNextRequest('http://localhost/api/config/allknower-login', { method: 'POST', body: { url: 'http://loc:30', email: 'u', password: 'p' } }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(502); // Missing token causes fallback error
      expect(res.body.error).toContain('No token in response');
    });
  });
});
