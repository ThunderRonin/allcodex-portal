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
  getNoteContent: vi.fn(),
}));

vi.mock('@/lib/sanitize', () => ({
  normalizeLoreHtmlForPortal: vi.fn((html) => html),
  sanitizePlayerView: vi.fn((html) => `PLAYER: ${html}`),
  sanitizeLoreHtml: vi.fn((html) => `GM: ${html}`),
}));

import { getEtapiCreds } from '@/lib/get-creds';
import { getNoteContent } from '@/lib/etapi-server';
import { GET } from './route';

describe('/api/lore/[id]/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns GM view by default', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(getNoteContent).mockResolvedValue('<p>secret</p>');

      const req = new MockNextRequest('http://localhost/api/lore/123/preview') as any;
      const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;

      expect(res.status).toBe(200);
      expect(res.body).toBe('GM: <p>secret</p>');
      expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    });

    it('returns Player view if requested', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockEtapiCreds());
      vi.mocked(getNoteContent).mockResolvedValue('<p>content</p>');

      const req = new MockNextRequest('http://localhost/api/lore/123/preview?mode=player') as any;
      const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;

      expect(res.status).toBe(200);
      expect(res.body).toBe('PLAYER: <p>content</p>');
    });

    it('returns 503 if not configured', async () => {
      vi.mocked(getEtapiCreds).mockResolvedValue(mockNoCreds());
      
      const req = new MockNextRequest('http://localhost/api/lore/123/preview') as any;
      const res = await GET(req, { params: Promise.resolve({ id: '123' }) }) as any;
      
      expect(res.status).toBe(503);
    });
  });
});
