import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock } from '@/app/api/__test-helpers__/mock-next';
import { mockEtapiCreds, mockNoCreds } from '@/app/api/__test-helpers__/mock-creds';
import { POST } from './route';

setupNextServerMock();

vi.mock('@/lib/get-creds', () => ({
  getEtapiCreds: vi.fn(),
}));

vi.mock('@/lib/etapi-server', () => ({
  searchNotesTitles: vi.fn(),
}));

import { getEtapiCreds } from '@/lib/get-creds';
import { searchNotesTitles } from '@/lib/etapi-server';

describe('/api/lore/autolink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('returns empty matches if text is short', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());

      const req = new MockNextRequest('http://localhost/api/lore/autolink', {
        method: 'POST',
        body: { text: 'hi' },
      }) as any;
      
      const res = await POST(req) as any;
      
      expect(res.status).toBe(200);
      expect(res.body.matches).toEqual([]);
    });

    it('returns matches from fetched titles', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(searchNotesTitles).mockResolvedValue([
        { noteId: '1', title: 'Solaris' },
        { noteId: '2', title: 'Kingdom of Solaris' },
      ]);

      const req = new MockNextRequest('http://localhost/api/lore/autolink', {
        method: 'POST',
        body: { text: 'The Kingdom of Solaris is grand.' },
      }) as any;
      
      const res = await POST(req) as any;
      
      expect(res.status).toBe(200);
      expect(res.body.matches.length).toBeGreaterThan(0);
      expect(res.body.matches[0].term).toBe('Kingdom of Solaris'); // Found longer title first
      expect(searchNotesTitles).toHaveBeenCalled();
    });

    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockNoCreds());
      
      const req = new MockNextRequest('http://localhost/api/lore/autolink', { method: 'POST', body: { text: 'test test test' } }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(503);
    });
  });
});
