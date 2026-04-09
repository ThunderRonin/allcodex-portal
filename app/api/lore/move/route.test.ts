import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock } from '@/app/api/__test-helpers__/mock-next';
import { mockEtapiCreds, mockNoCreds } from '@/app/api/__test-helpers__/mock-creds';
import { POST } from './route';

setupNextServerMock();

vi.mock('@/lib/get-creds', () => ({
  getEtapiCreds: vi.fn(),
}));

vi.mock('@/lib/etapi-server', () => ({
  createBranch: vi.fn(),
  getNote: vi.fn(),
  getBranch: vi.fn(),
  deleteBranch: vi.fn(),
  refreshNoteOrdering: vi.fn(),
}));

import { getEtapiCreds } from '@/lib/get-creds';
import { createBranch, getNote, getBranch, refreshNoteOrdering } from '@/lib/etapi-server';

describe('/api/lore/move', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('returns 400 if noteId or parentNoteId is missing', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());

      const req = new MockNextRequest('http://localhost/api/lore/move', { method: 'POST', body: { noteId: '123' } }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing noteId or newParentId');
    });

    it('creates branch to move note', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(getNote).mockResolvedValue({ noteId: 'note-1', parentBranchIds: ['old-b'] } as any);
      vi.mocked(getBranch).mockResolvedValue({ branchId: 'old-b', parentNoteId: 'some-other-parent' } as any);
      vi.mocked(createBranch).mockResolvedValue({ branchId: 'b-123' } as any);
      vi.mocked(refreshNoteOrdering).mockResolvedValue();

      const req = new MockNextRequest('http://localhost/api/lore/move', { method: 'POST', body: { noteId: 'note-1', newParentId: 'parent-1' } }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(200);
      expect(res.body.branch.branchId).toBe('b-123');
      expect(createBranch).toHaveBeenCalledWith(mockEtapiCreds(), { noteId: 'note-1', parentNoteId: 'parent-1', notePosition: undefined });
    });

    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockNoCreds());
      
      const req = new MockNextRequest('http://localhost/api/lore/move', { method: 'POST', body: { noteId: 'a', parentNoteId: 'b' } }) as any;
      const res = await POST(req) as any;
      
      expect(res.status).toBe(503);
    });
  });
});
