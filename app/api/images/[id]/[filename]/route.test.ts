import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock } from '@/app/api/__test-helpers__/mock-next';
import { mockEtapiCreds, mockNoCreds } from '@/app/api/__test-helpers__/mock-creds';
import { GET } from './route';

setupNextServerMock();

vi.mock('@/lib/get-creds', () => ({
  getEtapiCreds: vi.fn(),
}));

vi.mock('@/lib/etapi-server', () => ({
  getNote: vi.fn(),
}));

import { getEtapiCreds } from '@/lib/get-creds';
import { getNote } from '@/lib/etapi-server';

describe('/api/images/[id]/[filename]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns redirect when valid URL', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(getNote).mockResolvedValue({ mime: 'image/jpeg' } as any);

      // We are mocked the redirect but not testing the ETAPI upstream fetch
      // Let's just test that the route correctly proxies the GET params
      const req = new MockNextRequest('http://localhost/api/images/123/file.jpg') as any;
      const res = await GET(req, { params: Promise.resolve({ id: '123', filename: 'file.jpg' }) }) as any;
      
      expect(res.status).toBe(307);
      expect(res.body.url).toContain('/api/lore/123/image');
    });
  });
});
