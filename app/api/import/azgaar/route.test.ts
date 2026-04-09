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

describe('/api/import/azgaar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('forwards azgaar import', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(getAkCreds).mockResolvedValue(mockAkCreds());

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success' }),
      }) as any;

      const req = new MockNextRequest('http://localhost/api/import/azgaar?action=preview', { method: 'POST', body: { data: 'test' } }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(200);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(getAkCreds).mockResolvedValue(mockNoCreds());
      
      const req = new MockNextRequest('http://localhost/api/import/azgaar', { method: 'POST', body: {} }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(503);
    });
  });
});
