import { describe, expect, it } from 'vitest';
import {
  E2E_PERSONA_ATTRIBUTES,
  E2E_PERSONAS,
  E2E_SHARED_HOST_EMAIL,
  e2eNamespaceSchema,
  e2ePersonaSchema,
  isE2eEmail,
  toE2eNamespaceOfEmail,
  toE2ePersonaEmail,
  toE2ePersonaUpsert,
  toE2eSharedHostUpsert,
  toE2eSignInUpsert
} from '../personas';

const NOW = new Date('2026-10-06T00:00:00.000Z');

describe('e2ePersonaSchema', () => {
  it.each(E2E_PERSONAS)('accepts %s', (persona) => {
    expect(e2ePersonaSchema.parse(persona)).toBe(persona);
  });

  it.each(['owner', 'HOST', 'host ', '', 'e2e-host', 'admin@example.com'])(
    'rejects %j',
    (persona) => {
      expect(e2ePersonaSchema.safeParse(persona).success).toBe(false);
    }
  );
});

describe('e2eNamespaceSchema', () => {
  it.each(['abcd', 'a1b2c3', 'abc123w0c1'])('accepts %s', (ns) => {
    expect(e2eNamespaceSchema.parse(ns)).toBe(ns);
  });

  it.each([
    ['too short', 'abc'],
    ['too long', 'abcdefghijk'],
    ['uppercase', 'ABCD'],
    ['an at sign', 'ab@cd'],
    ['a dot', 'ab.cd'],
    ['a slash', 'ab/cd'],
    ['a percent sign', 'ab%cd'],
    ['a hyphen', 'ab-cd'],
    ['whitespace', 'ab cd'],
    ['a trailing newline', 'abcd\n'],
    ['unicode', 'abcdé'],
    ['an array', ['abcd']],
    ['an object', { ns: 'abcd' }],
    ['a number', 1234]
  ])('rejects %s', (_, ns) => {
    expect(e2eNamespaceSchema.safeParse(ns).success).toBe(false);
  });
});

describe('toE2ePersonaEmail', () => {
  it.each(E2E_PERSONAS)('gives %s an e2e email', (persona) => {
    const email = toE2ePersonaEmail(persona, 'abc123');

    expect(email).toMatch(/^e2e-[a-z0-9]+(-[a-z0-9]{4,10})?@example\.com$/);
    expect(isE2eEmail(email)).toBe(true);
    expect(toE2eNamespaceOfEmail(email)).toBe('abc123');
  });
});

describe('isE2eEmail', () => {
  it('accepts the shared host', () => {
    expect(isE2eEmail(E2E_SHARED_HOST_EMAIL)).toBe(true);
  });

  it.each([
    'host@example.com',
    'e2e-host@example.org',
    'e2e-host@example.com.evil.dev',
    'x-e2e-host@example.com',
    'e2e-host-abc@example.com',
    'e2e-host-abcdefghijk@example.com',
    'e2e-Host@example.com',
    'e2e-host-abc123@sub.example.com',
    '',
    null,
    undefined
  ])('rejects %j', (email) => {
    expect(isE2eEmail(email)).toBe(false);
  });
});

describe('toE2eNamespaceOfEmail', () => {
  it('finds no namespace in the shared host', () => {
    expect(toE2eNamespaceOfEmail(E2E_SHARED_HOST_EMAIL)).toBeUndefined();
  });

  it('finds no namespace in another email', () => {
    expect(toE2eNamespaceOfEmail('someone-abc123@example.com')).toBeUndefined();
  });
});

describe('toE2ePersonaUpsert', () => {
  it('creates and resets a host', () => {
    expect(
      toE2ePersonaUpsert({ persona: 'admin', ns: 'abc123', now: NOW })
    ).toEqual({
      where: { email: 'e2e-admin-abc123@example.com' },
      update: { accountType: 'HOST', onboarded: true },
      create: {
        email: 'e2e-admin-abc123@example.com',
        emailVerified: NOW,
        name: 'E2E admin',
        accountType: 'HOST',
        onboarded: true
      }
    });
  });

  it.each(['participant', 'participant2'] as const)(
    'creates %s as an onboarded participant',
    (persona) => {
      const upsert = toE2ePersonaUpsert({ persona, ns: 'abc123', now: NOW });

      expect(upsert.update).toEqual({
        accountType: 'PARTICIPANT',
        onboarded: true
      });
    }
  );

  it('resets the newbie to a participant who has not finished onboarding', () => {
    const upsert = toE2ePersonaUpsert({
      persona: 'newbie',
      ns: 'abc123',
      now: NOW
    });

    expect(upsert.update).toEqual({
      accountType: 'PARTICIPANT',
      onboarded: false,
      username: null
    });
    expect(upsert.create).toMatchObject({
      accountType: 'PARTICIPANT',
      onboarded: false
    });
  });
});

describe('E2E_PERSONA_ATTRIBUTES', () => {
  it('makes the team personas onboarded hosts, and only the newbie a new participant', () => {
    const host = { accountType: 'HOST', onboarded: true };
    const participant = { accountType: 'PARTICIPANT', onboarded: true };

    expect(E2E_PERSONA_ATTRIBUTES).toEqual({
      host,
      host2: host,
      admin: host,
      member: host,
      guest: host,
      blocked: host,
      participant,
      participant2: participant,
      newbie: { accountType: 'PARTICIPANT', onboarded: false }
    });
  });
});

describe('toE2eNamespaceOfEmail anchors', () => {
  it.each([
    'x-e2e-host-abc123@example.com',
    'e2e-host-abc123@example.com.evil.dev',
    'e2e-host-abc123@example.comx'
  ])('finds no namespace in %s', (email) => {
    expect(toE2eNamespaceOfEmail(email)).toBeUndefined();
  });

  it.each([null, undefined, ''])('finds no namespace in %j', (email) => {
    expect(toE2eNamespaceOfEmail(email)).toBeUndefined();
  });
});

describe('toE2eSharedHostUpsert', () => {
  it('creates and resets the shared host', () => {
    expect(toE2eSharedHostUpsert(NOW)).toEqual({
      where: { email: 'e2e-host@example.com' },
      update: { accountType: 'HOST', onboarded: true },
      create: {
        email: 'e2e-host@example.com',
        emailVerified: NOW,
        name: 'E2E Host',
        accountType: 'HOST',
        onboarded: true
      }
    });
  });
});

describe('toE2eSignInUpsert', () => {
  it('signs in the shared host when there is no persona and no namespace', () => {
    expect(
      toE2eSignInUpsert({ persona: undefined, ns: undefined, now: NOW })
    ).toEqual(toE2eSharedHostUpsert(NOW));
  });

  it.each(E2E_PERSONAS)('signs in %s in its namespace', (persona) => {
    expect(toE2eSignInUpsert({ persona, ns: 'abc123', now: NOW })).toEqual(
      toE2ePersonaUpsert({ persona, ns: 'abc123', now: NOW })
    );
  });

  it.each([
    ['a persona without a namespace', 'host', undefined],
    ['a namespace without a persona', undefined, 'abc123'],
    ['an unknown persona', 'owner', 'abc123'],
    ['an empty persona', '', 'abc123'],
    ['a null persona', null, 'abc123'],
    ['a bad namespace', 'host', 'ABC123'],
    ['an empty namespace', 'host', ''],
    ['a null namespace', 'host', null],
    ['a namespace in an array', 'host', ['abc123']]
  ])('signs in nobody with %s', (_, persona, ns) => {
    expect(toE2eSignInUpsert({ persona, ns, now: NOW })).toBeUndefined();
  });
});
