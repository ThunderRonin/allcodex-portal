import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest } from '@/app/api/__test-helpers__/mock-next';
import { mockEtapiCreds, mockNoCreds } from '@/app/api/__test-helpers__/mock-creds';
import { POST, DELETE } from './route';

vi.mock('next/server', () => {
  class MockResponse {
    constructor(public body: any, public options: any) {}
  }
  return {
    NextResponse: {
      json: vi.fn((body, init) => ({ body, status: init?.status ?? 200 })),
    },
    // We might need to handle new NextResponse(null)
  };
});

vi.mock('@/lib/get-creds', () => ({
  getEtapiCreds: vi.fn(),
}));

vi.mock('@/lib/etapi-server', () => ({
  createAttribute: vi.fn(),
  deleteAttribute: vi.fn(),
}));

import { getEtapiCreds } from '@/lib/get-creds';
import { createAttribute, deleteAttribute } from '@/lib/etapi-server';

describe('/api/lore/[id]/attributes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('creates attribute', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(createAttribute).mockResolvedValue({ attributeId: 'attr-1' } as any);

      const req = new MockNextRequest('http://localhost/api/lore/123/attributes', {
        method: 'POST',
        body: { type: 'label', name: 'draft', value: '' },
      }) as any;
      
      const res = await POST(req, { params: Promise.resolve({ id: '123' }) }) as any;
      
      expect(res.status).toBe(200);
      expect(createAttribute).toHaveBeenCalledWith(mockEtapiCreds(), { noteId: '123', type: 'label', name: 'draft', value: '' });
    });
  });

  describe('DELETE', () => {
    it('returns 400 if attrId missing', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());

      const req = new MockNextRequest('http://localhost/api/lore/123/attributes', { method: 'DELETE' }) as any;
      const res = await DELETE(req, { params: Promise.resolve({ id: '123' }) }) as any;

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing attrId');
    });

    it('deletes attribute', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(deleteAttribute).mockResolvedValue(undefined);

      const req = new MockNextRequest('http://localhost/api/lore/123/attributes?attrId=attr-1', { method: 'DELETE' }) as any;
      const res = await DELETE(req, { params: Promise.resolve({ id: '123' }) }) as any;

      expect(deleteAttribute).toHaveBeenCalledWith(mockEtapiCreds(), 'attr-1');
    });
  });
});
