import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock } from '@/app/api/__test-helpers__/mock-next';
import { mockEtapiCreds, mockNoCreds } from '@/app/api/__test-helpers__/mock-creds';
import { GET } from './route';

setupNextServerMock();

vi.mock('@/lib/get-creds', () => ({
  getEtapiCreds: vi.fn(),
}));

vi.mock('@/lib/etapi-server', () => ({
  searchNotes: vi.fn(),
}));

import { getEtapiCreds } from '@/lib/get-creds';
import { searchNotes } from '@/lib/etapi-server';

describe('/api/timeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('fetches timelines and historical events', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(searchNotes).mockResolvedValue([{ noteId: '1', title: 'Event 1', type: 'text', attributes: [] }] as any);

      const req = new MockNextRequest('http://localhost/api/timeline') as any;
      const res = await GET(req) as any;
      
      expect(res.status).toBe(200);
      // Timeline endpoint merges results.
      expect(res.body.length).toBeDefined();
    });

    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockNoCreds());
      
      const req = new MockNextRequest('http://localhost/api/timeline') as any;
      const res = await GET(req) as any;
      
      expect(res.status).toBe(503);
    });
  });
});
