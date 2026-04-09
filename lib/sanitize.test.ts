import { describe, it, expect } from 'vitest';
import {
  sanitizeLoreHtml,
  sanitizePlayerView,
  normalizeLoreHtmlForPortal,
} from './sanitize';

describe('sanitize', () => {
  describe('normalizeLoreHtmlForPortal', () => {
    it('rewrites image src patterns', () => {
      const html = '<img src="/api/lore/abc123_456/image" /> <img src="api/images/def/image" />';
      const normalized = normalizeLoreHtmlForPortal(html);
      expect(normalized).toBe('<img src="/api/images/abc123_456/image" /> <img src="/api/images/def/image" />');
    });
  });

  describe('sanitizeLoreHtml', () => {
    it('strips <script> tags', () => {
      const html = '<script>alert("xss")</script><p>safe</p>';
      const result = sanitizeLoreHtml(html);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>safe</p>');
    });

    it('preserves allowed tags and classes', () => {
      const html = '<h1 class="title">Heading</h1><p data-note-id="xyz">Text</p>';
      const result = sanitizeLoreHtml(html);
      expect(result).toContain('class="title"');
      expect(result).toContain('data-note-id="xyz"');
    });
  });

  describe('sanitizePlayerView', () => {
    it('removes .gm-only elements', () => {
      const html = '<div><p>Player text</p><p class="gm-only">GM text</p></div>';
      const result = sanitizePlayerView(html);
      expect(result).toContain('Player text');
      expect(result).not.toContain('GM text');
    });
  });
});
