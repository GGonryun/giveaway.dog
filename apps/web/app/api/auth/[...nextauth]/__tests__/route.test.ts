import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

const m = vi.hoisted(() => ({
  GET: vi.fn(),
  POST: vi.fn()
}));

vi.mock('@giveaway/auth-server/config', () => ({
  handlers: { GET: m.GET, POST: m.POST },
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn()
}));

describe('[...nextauth] route', () => {
  beforeEach(() => {
    m.GET.mockReset();
    m.POST.mockReset();
  });

  it('re-exports the NextAuth GET handler', () => {
    expect(GET).toBe(m.GET);
  });

  it('re-exports the NextAuth POST handler', () => {
    expect(POST).toBe(m.POST);
  });

  it('delegates GET requests to the NextAuth handler unchanged', async () => {
    const response = new Response('session');
    m.GET.mockResolvedValue(response);
    const req = new NextRequest('http://localhost:3000/api/auth/session');

    const res = await GET(req);

    expect(res).toBe(response);
    expect(m.GET).toHaveBeenCalledWith(req);
  });

  it('delegates POST requests to the NextAuth handler unchanged', async () => {
    const response = new Response('signed-in');
    m.POST.mockResolvedValue(response);
    const req = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST'
    });

    const res = await POST(req);

    expect(res).toBe(response);
    expect(m.POST).toHaveBeenCalledWith(req);
  });
});
