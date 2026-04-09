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
  searchNotes: vi.fn(),
}));

import { getEtapiCreds } from '@/lib/get-creds';
import { searchNotes } from '@/lib/etapi-server';

describe('/api/lore/note-search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 200 with empty array if query is short', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());

      const req = new MockNextRequest('http://localhost/api/lore/note-search?q=a') as any;
      const res = await GET(req) as any;
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns search titles for valid query', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(searchNotes).mockResolvedValue([
        { noteId: '1', title: 'Solaris', type: 'image', attributes: [] } as any,
      ]);

      const req = new MockNextRequest('http://localhost/api/lore/note-search?q=sol&type=image') as any;
      const res = await GET(req) as any;
      
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(searchNotes).toHaveBeenCalled();
    });

    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockNoCreds());
      
      const req = new MockNextRequest('http://localhost/api/lore/note-search?q=sol') as any;
      const res = await GET(req) as any;
      
      expect(res.status).toBe(503);
    });
  });
});
