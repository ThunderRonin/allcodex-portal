import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest } from '@/app/api/__test-helpers__/mock-next';
import { mockEtapiCreds, mockNoCreds } from '@/app/api/__test-helpers__/mock-creds';
import { GET, POST } from './route';

vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body, init) => ({ body, status: init?.status ?? 200 })),
    },
  };
});

vi.mock('@/lib/get-creds', () => ({
  getEtapiCreds: vi.fn(),
  getLoreRootNoteId: vi.fn().mockResolvedValue('root'),
}));

vi.mock('@/lib/etapi-server', () => ({
  searchNotes: vi.fn(),
  createNote: vi.fn(),
  createAttribute: vi.fn(),
}));

import { getEtapiCreds } from '@/lib/get-creds';
import { searchNotes, createNote, createAttribute } from '@/lib/etapi-server';

describe('/api/lore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns notes for valid search', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(searchNotes).mockResolvedValue([{ noteId: '123', title: 'test', type: 'text', mime: 'text/html', isProtected: false, dateCreated: '', dateModified: '', utcDateModified: '', parentNoteIds: [], childNoteIds: [], parentBranchIds: [], childBranchIds: [], attributes: [] }]);

      const req = new MockNextRequest('http://localhost/api/lore?q=hello') as any;
      const res = await GET(req) as any;

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(searchNotes).toHaveBeenCalledWith(mockEtapiCreds(), 'hello');
    });

    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockNoCreds());

      const req = new MockNextRequest('http://localhost/api/lore?q=#test') as any;
      const res = await GET(req) as any;

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('NOT_CONFIGURED');
    });
  });

  describe('POST', () => {
    it('creates note and attributes', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(createNote).mockResolvedValue({ note: { noteId: 'new-id' } } as any);
      vi.mocked(createAttribute).mockResolvedValue({} as any);

      const req = new MockNextRequest('http://localhost/api/lore', {
        method: 'POST',
        body: { title: 'New Note', loreType: 'character', templateId: 't-123', attributes: { "age": "100" } },
      }) as any;
      
      const res = await POST(req) as any;
      
      expect(res.status).toBe(201);
      expect(res.body.note.noteId).toBe('new-id');
      expect(createAttribute).toHaveBeenCalledWith(mockEtapiCreds(), { noteId: 'new-id', type: 'label', name: 'lore', value: '' });
      expect(createAttribute).toHaveBeenCalledWith(mockEtapiCreds(), { noteId: 'new-id', type: 'label', name: 'loreType', value: 'character' });
      expect(createAttribute).toHaveBeenCalledWith(mockEtapiCreds(), { noteId: 'new-id', type: 'relation', name: 'template', value: 't-123' });
      expect(createAttribute).toHaveBeenCalledWith(mockEtapiCreds(), { noteId: 'new-id', type: 'label', name: 'age', value: '100' });
    });

    it('returns 503 if not configured on POST', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockNoCreds());

      const req = new MockNextRequest('http://localhost/api/lore', { method: 'POST', body: {} }) as any;
      const res = await POST(req) as any;

      expect(res.status).toBe(503);
    });
  });
});
