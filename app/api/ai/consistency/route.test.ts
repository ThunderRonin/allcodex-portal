import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock } from '@/app/api/__test-helpers__/mock-next';
import { mockEtapiCreds, mockAkCreds, mockNoCreds } from '@/app/api/__test-helpers__/mock-creds';
import { POST } from './route';

setupNextServerMock();

vi.mock('@/lib/get-creds', () => ({
  getEtapiCreds: vi.fn(),
  getAkCreds: vi.fn(),
}));

vi.mock('@/lib/allknower-server', () => ({
  checkConsistency: vi.fn(),
}));

import { getEtapiCreds, getAkCreds } from '@/lib/get-creds';
import { checkConsistency } from '@/lib/allknower-server';

describe('/api/ai/consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('returns consistency report', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(getAkCreds).mockResolvedValue(mockAkCreds());
      vi.mocked(checkConsistency).mockResolvedValue({ issues: [], summary: 'All consistent.' });

      const req = new MockNextRequest('http://localhost/api/ai/consistency', { method: 'POST', body: { noteIds: ['1', '2'] } }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(200);
      expect(res.body.issues).toBeDefined();
      expect(checkConsistency).toHaveBeenCalledWith(mockAkCreds(), ['1', '2']);
    });

    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(getAkCreds).mockResolvedValue(mockNoCreds());
      
      const req = new MockNextRequest('http://localhost/api/ai/consistency', { method: 'POST', body: {} }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(503);
    });
  });
});
