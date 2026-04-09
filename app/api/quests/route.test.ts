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
  getNote: vi.fn(),
}));

import { getEtapiCreds } from '@/lib/get-creds';
import { searchNotes } from '@/lib/etapi-server';

describe('/api/quests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('filters quest notes', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(searchNotes).mockResolvedValue([{ noteId: '1', title: 'Quest 1', type: 'text', attributes: [] }] as any);

      const req = new MockNextRequest('http://localhost/api/quests') as any;
      const res = await GET(req) as any;
      
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockNoCreds());
      
      const req = new MockNextRequest('http://localhost/api/quests') as any;
      const res = await GET(req) as any;
      
      expect(res.status).toBe(503);
    });
  });
});
