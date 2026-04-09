import { vi, describe, it, expect } from 'vitest';
import { handleRouteError, notConfigured, ServiceError } from './route-error';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, status: init?.status ?? 200 })),
  },
}));

describe('route-error', () => {
  describe('handleRouteError', () => {
    it('handles ServiceError correctly', () => {
      const error = new ServiceError('UNAUTHORIZED', 401, 'Test unauthorized');
      const response = handleRouteError(error) as unknown as { body: any; status: number };
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'UNAUTHORIZED', message: 'Test unauthorized' });
    });

    it('handles string errors implying unreachability', () => {
      const response = handleRouteError(new Error('ECONNREFUSED connection failed')) as unknown as { body: any; status: number };
      expect(response.status).toBe(503);
      expect(response.body.error).toBe('UNREACHABLE');
    });

    it('handles unknown errors gracefully', () => {
      const response = handleRouteError(new Error('Something went wrong')) as unknown as { body: any; status: number };
      expect(response.status).toBe(502);
      expect(response.body.error).toBe('SERVICE_ERROR');
    });
  });

  describe('notConfigured', () => {
    it('returns missing credentials response', () => {
      const response = notConfigured('AllCodex') as unknown as { body: any; status: number };
      expect(response.status).toBe(503);
      expect(response.body.error).toBe('NOT_CONFIGURED');
      expect(response.body.message).toContain('AllCodex is not connected');
    });
  });
});
