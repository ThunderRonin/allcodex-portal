import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock } from '@/app/api/__test-helpers__/mock-next';
import { mockEtapiCreds, mockAkCreds, mockNoCreds } from '@/app/api/__test-helpers__/mock-creds';

setupNextServerMock();

vi.mock('@/lib/get-creds', () => ({
  getEtapiCreds: vi.fn(),
  getAkCreds: vi.fn(),
}));

vi.mock('@/lib/etapi-server', () => ({
  getNote: vi.fn(),
  getNoteContent: vi.fn(),
}));

vi.mock('@/lib/allknower-server', () => ({
  suggestRelationships: vi.fn(),
}));

import { getEtapiCreds, getAkCreds } from '@/lib/get-creds';
import { getNote, getNoteContent } from '@/lib/etapi-server';
import { suggestRelationships } from '@/lib/allknower-server';
import { POST } from './route';

describe('/api/lore/[id]/relationships', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('returns existing relationships and suggestions', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(getAkCreds).mockResolvedValue(mockAkCreds());
      
      vi.mocked(getNote).mockResolvedValueOnce({ title: 'Test Note', attributes: [{ type: 'relation', name: 'ally', value: 'res-id' }] } as any);
      vi.mocked(getNote).mockResolvedValueOnce({ title: 'Resolved Ally' } as any);
      
      vi.mocked(getNoteContent).mockResolvedValue('<p>content text</p>');
      vi.mocked(suggestRelationships).mockResolvedValue({ suggestions: [] });

      const req = new MockNextRequest('http://localhost/api/lore/123/relationships', { method: 'POST' }) as any;
      const res = await POST(req, { params: Promise.resolve({ id: '123' }) }) as any;

      expect(res.status).toBe(200);
      expect(res.body.existing.length).toBe(1);
      expect(res.body.existing[0].targetTitle).toBe('Resolved Ally');
    });

    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(getAkCreds).mockResolvedValue(mockNoCreds());
      
      const req = new MockNextRequest('http://localhost/api/lore/123/relationships', { method: 'POST' }) as any;
      const res = await POST(req, { params: Promise.resolve({ id: '123' }) }) as any;
      
      expect(res.status).toBe(503);
    });
  });
});
