import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock } from '@/app/api/__test-helpers__/mock-next';
import { mockEtapiCreds, mockAkCreds, mockNoCreds } from '@/app/api/__test-helpers__/mock-creds';
import { POST } from './route';

setupNextServerMock();

vi.mock('@/lib/get-creds', () => ({
  getEtapiCreds: vi.fn(),
  getAkCreds: vi.fn(),
}));

import { getEtapiCreds, getAkCreds } from '@/lib/get-creds';

describe('/api/import/system-pack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(getAkCreds).mockResolvedValue(mockNoCreds());
      
      const req = new MockNextRequest('http://localhost/api/import/system-pack', { method: 'POST' }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(503);
    });

    it('proxies request to AllKnower', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(getAkCreds).mockResolvedValue(mockAkCreds());

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      }) as any;

      const req = new MockNextRequest('http://localhost/api/import/system-pack', { method: 'POST', body: { id: "pack" } }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(200);
      expect(res.body.results).toBeDefined();
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
