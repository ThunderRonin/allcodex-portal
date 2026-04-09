import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock } from '@/app/api/__test-helpers__/mock-next';
import { mockEtapiCreds, mockNoCreds } from '@/app/api/__test-helpers__/mock-creds';

setupNextServerMock();

vi.mock('@/lib/get-creds', () => ({
  getEtapiCreds: vi.fn(),
}));

vi.mock('@/lib/etapi-server', () => ({
  getNoteAncestors: vi.fn(),
}));

import { getEtapiCreds } from '@/lib/get-creds';
import { getNoteAncestors } from '@/lib/etapi-server';
import { GET } from './route';

describe('/api/lore/[id]/breadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns breadcrumbs', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(getNoteAncestors).mockResolvedValue([{ noteId: '123', title: 'test' }]);

      const req = new MockNextRequest('http://localhost/api/lore/123/breadcrumbs') as any;
      const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(getNoteAncestors).toHaveBeenCalledWith(mockEtapiCreds(), '123');
    });

    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockNoCreds());
      
      const req = new MockNextRequest('http://localhost/api/lore/123/breadcrumbs') as any;
      const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;
      
      expect(res.status).toBe(503);
    });
  });
});
