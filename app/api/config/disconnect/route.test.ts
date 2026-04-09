import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock, mockCookieJar } from '@/app/api/__test-helpers__/mock-next';
import { DELETE } from './route';

setupNextServerMock();

const mockCookies = mockCookieJar();

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookies),
}));

describe('/api/config/disconnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DELETE', () => {
    it('clears all cookies when service=all', async () => {
      const req = new MockNextRequest('http://localhost/api/config/disconnect?service=all', { method: 'DELETE' }) as any;
      const res = await DELETE(req) as any;
      
      expect(res.status).toBe(200);
      expect(mockCookies.delete).toHaveBeenCalledWith('allcodex_token');
      expect(mockCookies.delete).toHaveBeenCalledWith('allknower_token');
    });

    it('clears specific cookie', async () => {
      const req = new MockNextRequest('http://localhost/api/config/disconnect?service=allcodex', { method: 'DELETE' }) as any;
      const res = await DELETE(req) as any;
      
      expect(res.status).toBe(200);
      expect(mockCookies.delete).toHaveBeenCalledWith('allcodex_token');
      expect(mockCookies.delete).not.toHaveBeenCalledWith('allknower_token');
    });
  });
});
