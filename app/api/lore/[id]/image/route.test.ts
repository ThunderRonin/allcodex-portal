import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockNextRequest } from '@/app/api/__test-helpers__/mock-next';
import { mockEtapiCreds, mockNoCreds } from '@/app/api/__test-helpers__/mock-creds';

vi.mock('next/server', () => {
  class NextResponse {
    status: number;
    body: any;
    headers: any;
    constructor(body?: any, init?: any) {
      this.status = init?.status ?? 200;
      this.body = body;
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
  }
  return { NextResponse };
});

vi.mock('@/lib/get-creds', () => ({
  getEtapiCreds: vi.fn(),
}));

vi.mock('@/lib/etapi-server', () => ({
  getNote: vi.fn(),
}));

import { getEtapiCreds } from '@/lib/get-creds';
import { getNote } from '@/lib/etapi-server';
import { GET } from './route';

describe('/api/lore/[id]/image', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockNoCreds());
      
      const req = new MockNextRequest('http://localhost/api/lore/123/image') as any;
      const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;
      
      expect(res.status).toBe(503);
    });

    it('returns internal server error if fetch fails', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(getNote).mockResolvedValue({ mime: 'image/png' } as any);
      
      // Mock global fetch to fail
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const req = new MockNextRequest('http://localhost/api/lore/123/image') as any;
      const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;

      expect(res.status).toBe(404);
      expect(res.body).toContain('Error fetching image');
    });
  });
});
