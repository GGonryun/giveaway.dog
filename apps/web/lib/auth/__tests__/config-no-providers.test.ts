import { describe, it, expect, vi } from 'vitest';
import { noProviderAuth } from '../config-no-providers';
import { createAuthConfig, type GetSession } from '../config-runtime';

const nextAuth = vi.hoisted(() => {
  const instance = {
    auth: vi.fn(),
    handlers: { GET: vi.fn(), POST: vi.fn() },
    signIn: vi.fn(),
    signOut: vi.fn()
  };
  return { instance, NextAuth: vi.fn(() => instance) };
});

const loaded = vi.hoisted(() => ({ config: false }));

vi.unmock('@/lib/auth/config-no-providers');

vi.mock('next-auth', () => ({ default: nextAuth.NextAuth }));

vi.mock('../config-runtime', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../config-runtime')>();
  return { ...actual, createAuthConfig: vi.fn(actual.createAuthConfig) };
});

vi.mock('../config', () => {
  loaded.config = true;
  return {};
});

type AuthConfig = ReturnType<typeof createAuthConfig>;

const createAuthConfigMock = vi.mocked(createAuthConfig);

const runtimeConfig = () =>
  createAuthConfigMock.mock.results[0].value as AuthConfig;

const getSession = () => createAuthConfigMock.mock.calls[0][0] as GetSession;

describe('noProviderAuth', () => {
  it('creates exactly one NextAuth instance', () => {
    expect(nextAuth.NextAuth).toHaveBeenCalledTimes(1);
  });

  it('is the NextAuth instance built from the runtime config', () => {
    expect(noProviderAuth).toBe(nextAuth.instance);
  });

  it('builds the runtime config once', () => {
    expect(createAuthConfigMock).toHaveBeenCalledTimes(1);
  });

  it('uses the runtime config with every provider removed', () => {
    expect(nextAuth.NextAuth).toHaveBeenCalledWith({
      ...runtimeConfig(),
      providers: []
    });
  });

  it('keeps the runtime callbacks and events', () => {
    const [config] = nextAuth.NextAuth.mock.calls[0] as unknown as [AuthConfig];

    expect(config.callbacks).toBe(runtimeConfig().callbacks);
    expect(config.events).toBe(runtimeConfig().events);
  });

  it('gives the runtime config a session getter that returns null', async () => {
    await expect(getSession()()).resolves.toBeNull();
  });

  it('does not load the config with the login providers', async () => {
    await getSession()();

    expect(loaded.config).toBe(false);
  });
});
