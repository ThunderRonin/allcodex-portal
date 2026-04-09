import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock } from '@/app/api/__test-helpers__/mock-next';
import { mockEtapiCreds, mockNoCreds } from '@/app/api/__test-helpers__/mock-creds';
import { GET } from './route';

setupNextServerMock();

vi.mock('@/lib/get-creds', () => ({
  getEtapiCreds: vi.fn(),
  getLoreRootNoteId: vi.fn().mockResolvedValue('root-1'),
}));

vi.mock('@/lib/etapi-server', () => ({
  searchNotesTitles: vi.fn(),
}));

import { getEtapiCreds } from '@/lib/get-creds';
import { searchNotesTitles } from '@/lib/etapi-server';

describe('/api/lore/mention-search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 400 if query is missing or short', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());

      const req = new MockNextRequest('http://localhost/api/lore/mention-search?q=a') as any;
      const res = await GET(req) as any;
      
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    it('returns matched items for valid query', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(searchNotesTitles).mockResolvedValue([
        { noteId: '1', title: 'Solaris', loreType: 'character' },
      ]);

      const req = new MockNextRequest('http://localhost/api/lore/mention-search?q=sol') as any;
      const res = await GET(req) as any;
      
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Solaris');
      expect(searchNotesTitles).toHaveBeenCalled();
    });

    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockNoCreds());
      
      const req = new MockNextRequest('http://localhost/api/lore/mention-search?q=sol') as any;
      const res = await GET(req) as any;
      
      expect(res.status).toBe(503);
    });
  });
});
