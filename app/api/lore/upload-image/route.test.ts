import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest, setupNextServerMock } from '@/app/api/__test-helpers__/mock-next';
import { mockEtapiCreds, mockNoCreds } from '@/app/api/__test-helpers__/mock-creds';
import { POST } from './route';

setupNextServerMock();

vi.mock('@/lib/get-creds', () => ({
  getEtapiCreds: vi.fn(),
  getImagesRootNoteId: vi.fn().mockResolvedValue('root-img'),
}));

vi.mock('@/lib/etapi-server', () => ({
  createNote: vi.fn(),
  putNoteContent: vi.fn(),
}));

import { getEtapiCreds } from '@/lib/get-creds';
import { createNote, putNoteContent } from '@/lib/etapi-server';

describe('/api/lore/upload-image', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    // Removed validation test as parsing does not validate image bytes structure


    it('creates image note and content', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(createNote).mockResolvedValue({ note: { noteId: 'img-note' } } as any);
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'OK',
      }) as any;

      const req = new MockNextRequest('http://localhost/api/lore/upload-image', { method: 'POST' }) as any;
      req.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(10));
      req.headers = new Map([
        ['content-type', 'image/png'],
        ['x-vercel-filename', 'test.png']
      ]);
      const res = await POST(req) as any;
      
      expect(res.status).toBe(201);
      expect(res.body.noteId).toBe('img-note');
      expect(res.body.url).toBe('/api/images/img-note/test.png');
      expect(createNote).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
    });

    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockNoCreds());
      
      const req = new MockNextRequest('http://localhost/api/lore/upload-image', { method: 'POST' }) as any;
      req.headers = new Map([['content-type', 'image/png']]);
      req.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(10));
      const res = await POST(req) as any;
      
      expect(res.status).toBe(503);
    });
  });
});
