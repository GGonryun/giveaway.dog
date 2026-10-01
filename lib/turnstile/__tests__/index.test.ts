import { describe, it, expect, vi } from 'vitest';
import * as turnstile from '../index';
import { setTurnstileToken } from '../cookies';
import { checkTurnstileVerification, verifyTurnstileToken } from '../server';
import { getLastTurnstileCheck } from '../check-status';
import verifyTurnstile from '../verify';
import { TURNSTILE_COOKIE_DAYS, TURNSTILE_COOKIE_NAME } from '../consts';
import { turnstileStatusSchema } from '../schemas';

const m = vi.hoisted(() => ({
  TurnstileGate: vi.fn(),
  TurnstileWidget: vi.fn(),
  TurnstileProvider: vi.fn(),
  useTurnstile: vi.fn()
}));

vi.mock('../gate', () => ({ TurnstileGate: m.TurnstileGate }));
vi.mock('../widget', () => ({ TurnstileWidget: m.TurnstileWidget }));
vi.mock('../provider', () => ({ TurnstileProvider: m.TurnstileProvider }));
vi.mock('../context', () => ({ useTurnstile: m.useTurnstile }));

describe('turnstile barrel', () => {
  it('exposes exactly the public turnstile API', () => {
    expect(Object.keys(turnstile).sort()).toEqual(
      [
        'TURNSTILE_COOKIE_DAYS',
        'TURNSTILE_COOKIE_NAME',
        'TurnstileGate',
        'TurnstileProvider',
        'TurnstileStatusSchema',
        'TurnstileWidget',
        'checkTurnstileVerification',
        'getLastTurnstileCheck',
        'setTurnstileToken',
        'useTurnstile',
        'verifyTurnstile',
        'verifyTurnstileToken'
      ].sort()
    );
  });

  it('re-exports the server helpers', () => {
    expect(turnstile.setTurnstileToken).toBe(setTurnstileToken);
    expect(turnstile.checkTurnstileVerification).toBe(
      checkTurnstileVerification
    );
    expect(turnstile.verifyTurnstileToken).toBe(verifyTurnstileToken);
  });

  it('re-exports the procedures, with verify as verifyTurnstile', () => {
    expect(turnstile.getLastTurnstileCheck).toBe(getLastTurnstileCheck);
    expect(turnstile.verifyTurnstile).toBe(verifyTurnstile);
  });

  it('re-exports the cookie constants but not the database window', () => {
    expect(turnstile.TURNSTILE_COOKIE_NAME).toBe(TURNSTILE_COOKIE_NAME);
    expect(turnstile.TURNSTILE_COOKIE_DAYS).toBe(TURNSTILE_COOKIE_DAYS);
    expect('TURNSTILE_DB_DAYS' in turnstile).toBe(false);
  });

  it('re-exports the status schema as TurnstileStatusSchema', () => {
    expect(turnstile.TurnstileStatusSchema).toBe(turnstileStatusSchema);
  });

  it('re-exports the client components and hook', () => {
    expect(turnstile.TurnstileGate).toBe(m.TurnstileGate);
    expect(turnstile.TurnstileWidget).toBe(m.TurnstileWidget);
    expect(turnstile.TurnstileProvider).toBe(m.TurnstileProvider);
    expect(turnstile.useTurnstile).toBe(m.useTurnstile);
  });
});
