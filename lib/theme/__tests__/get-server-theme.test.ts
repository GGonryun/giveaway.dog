import { describe, it, expect, vi, beforeEach } from 'vitest';

const headers = vi.hoisted(() => ({
  cookies: vi.fn(),
  get: vi.fn()
}));

vi.mock('next/headers', () => ({ cookies: headers.cookies }));

import { getServerTheme } from '../get-server-theme';

const withThemeCookie = (value?: string) => {
  headers.get.mockImplementation((name: string) =>
    value === undefined ? undefined : { name, value }
  );
};

describe('getServerTheme', () => {
  beforeEach(() => {
    headers.get.mockReset();
    headers.cookies.mockReset();
    headers.cookies.mockResolvedValue({ get: headers.get });
  });

  it('reads the giveaway-theme cookie', async () => {
    withThemeCookie('light');

    await getServerTheme();

    expect(headers.get).toHaveBeenCalledWith('giveaway-theme');
  });

  it('returns light when the cookie is light', async () => {
    withThemeCookie('light');

    await expect(getServerTheme()).resolves.toBe('light');
  });

  it('returns dark when the cookie is dark', async () => {
    withThemeCookie('dark');

    await expect(getServerTheme()).resolves.toBe('dark');
  });

  it('returns dark when the cookie is system', async () => {
    withThemeCookie('system');

    await expect(getServerTheme()).resolves.toBe('dark');
  });

  it('returns dark when there is no theme cookie', async () => {
    withThemeCookie();

    await expect(getServerTheme()).resolves.toBe('dark');
  });

  it('returns dark when the cookie is empty', async () => {
    withThemeCookie('');

    await expect(getServerTheme()).resolves.toBe('dark');
  });

  it('returns an unrecognized cookie value unchanged', async () => {
    withThemeCookie('sepia');

    await expect(getServerTheme()).resolves.toBe('sepia');
  });

  it('propagates failures reading the cookie store', async () => {
    headers.cookies.mockRejectedValue(new Error('outside request scope'));

    await expect(getServerTheme()).rejects.toThrow('outside request scope');
  });
});
