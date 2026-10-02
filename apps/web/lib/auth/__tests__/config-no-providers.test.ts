import { describe, it, expect, vi } from 'vitest';
import { noProviderAuth } from '../config-no-providers';
import { authConfig } from '../config-runtime';

const nextAuth = vi.hoisted(() => {
  const instance = {
    auth: vi.fn(),
    handlers: { GET: vi.fn(), POST: vi.fn() },
    signIn: vi.fn(),
    signOut: vi.fn()
  };
  return { instance, NextAuth: vi.fn(() => instance) };
});

vi.unmock('@/lib/auth/config-no-providers');

vi.mock('next-auth', () => ({ default: nextAuth.NextAuth }));

vi.mock('../config', () => ({ auth: vi.fn() }));

describe('noProviderAuth', () => {
  it('creates exactly one NextAuth instance', () => {
    expect(nextAuth.NextAuth).toHaveBeenCalledTimes(1);
  });

  it('is the NextAuth instance built from the runtime config', () => {
    expect(noProviderAuth).toBe(nextAuth.instance);
  });

  it('uses the runtime config with every provider removed', () => {
    expect(nextAuth.NextAuth).toHaveBeenCalledWith({
      ...authConfig,
      providers: []
    });
  });

  it('keeps the runtime callbacks and events', () => {
    const [config] = nextAuth.NextAuth.mock.calls[0] as unknown as [
      typeof authConfig
    ];

    expect(config.callbacks).toBe(authConfig.callbacks);
    expect(config.events).toBe(authConfig.events);
  });
});
