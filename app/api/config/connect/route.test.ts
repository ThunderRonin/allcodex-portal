import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock, mockCookieJar } from '@/app/api/__test-helpers__/mock-next';
import { POST } from './route';

setupNextServerMock();

const mockCookies = mockCookieJar();

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookies),
}));

describe('/api/config/connect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('sets cookies for provided services', async () => {
      const req = new MockNextRequest('http://localhost/api/config/connect', {
        method: 'POST',
        body: { allcodex: { url: 'url', token: 'token' } },
      }) as any;
      
      const res = await POST(req) as any;
      
      expect(res.status).toBe(200);
      expect(mockCookies.set).toHaveBeenCalledWith(
        'allcodex_url',
        'url',
        expect.any(Object)
      );
      expect(mockCookies.set).toHaveBeenCalledWith(
        'allcodex_token',
        'token',
        expect.any(Object)
      );
    });

    it('returns 400 if no services provided', async () => {
      const req = new MockNextRequest('http://localhost/api/config/connect', {
        method: 'POST',
        body: {},
      }) as any;
      
      const res = await POST(req) as any;
      
      expect(res.status).toBe(400);
    });
  });
});
