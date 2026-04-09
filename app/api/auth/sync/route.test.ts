import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock, mockCookieJar } from '@/app/api/__test-helpers__/mock-next';
import { POST } from './route';

setupNextServerMock();

const mockCookies = mockCookieJar();

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookies),
}));

describe('/api/auth/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('sets allknower_token cookie on successful sync', async () => {
      const req = new MockNextRequest('http://localhost/api/auth/sync', { 
        method: 'POST', 
        body: { token: 'test-ak-token', user: {} } 
      }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(200);
      expect(mockCookies.set).toHaveBeenCalledWith(
        'allknower_token', 
        'test-ak-token', 
        expect.any(Object)
      );
    });
  });
});
