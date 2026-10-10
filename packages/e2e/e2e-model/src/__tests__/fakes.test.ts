import { describe, expect, it } from 'vitest';
import {
  E2E_FAKE_ID_PREFIX,
  E2E_FAKE_SERVICES,
  E2E_OUTBOX_TTL_SECONDS,
  e2eOutboxQuerySchema,
  parseE2eFakeServices,
  toE2eOutboxKey,
  toE2eXFixtureRetweeterUsername
} from '../fakes';

describe('parseE2eFakeServices', () => {
  it.each(['all', 'ALL', ' all ', 'email,all'])(
    'turns on every service for %j',
    (value) => {
      expect(parseE2eFakeServices(value)).toEqual([...E2E_FAKE_SERVICES]);
    }
  );

  it('lists every service of the issue', () => {
    expect(E2E_FAKE_SERVICES).toEqual([
      'email',
      'scrapebadger',
      'geo',
      'discord',
      'x',
      'bluesky',
      'moderation'
    ]);
  });

  it('turns on the listed services in their fixed order', () => {
    expect(parseE2eFakeServices('moderation, Email ,geo')).toEqual([
      'email',
      'geo',
      'moderation'
    ]);
  });

  it.each([undefined, null, '', ' , ', 'none', 'emails', 'oauth'])(
    'turns on nothing for %j',
    (value) => {
      expect(parseE2eFakeServices(value)).toEqual([]);
    }
  );
});

describe('e2eOutboxQuerySchema', () => {
  it.each([
    ['email', 'e2e-host-abc123@example.com'],
    ['discord-alert', 'cmabc123'],
    ['discord', '1234567890'],
    ['x', 'team_1'],
    ['bluesky', 'Team.1+a']
  ])('accepts the channel %s with the target %s', (channel, target) => {
    expect(e2eOutboxQuerySchema.parse({ channel, target })).toEqual({
      channel,
      target
    });
  });

  it.each([
    { channel: 'sms', target: 'a' },
    { channel: 'email', target: '' },
    { channel: 'email', target: 'a:b' },
    { channel: 'email', target: 'a b' },
    { channel: 'email', target: 'a'.repeat(201) },
    { channel: 'email', target: 'a', extra: 1 }
  ])('refuses %j', (query) => {
    expect(e2eOutboxQuerySchema.safeParse(query).success).toBe(false);
  });

  it('accepts a target of 200 characters', () => {
    expect(
      e2eOutboxQuerySchema.safeParse({
        channel: 'x',
        target: 'a'.repeat(200)
      }).success
    ).toBe(true);
  });
});

describe('the outbox limits', () => {
  it('keeps the entries for one hour', () => {
    expect(E2E_OUTBOX_TTL_SECONDS).toBe(3600);
  });

  it('starts each fake id with e2e-fake-', () => {
    expect(E2E_FAKE_ID_PREFIX).toBe('e2e-fake-');
  });
});

describe('toE2eOutboxKey', () => {
  it('puts the channel and the target in lower case under e2e:outbox', () => {
    expect(
      toE2eOutboxKey({ channel: 'email', target: 'E2E-Host@Example.com' })
    ).toBe('e2e:outbox:email:e2e-host@example.com');
  });
});

describe('toE2eXFixtureRetweeterUsername', () => {
  it('numbers the retweeters', () => {
    expect(toE2eXFixtureRetweeterUsername(7)).toBe('e2e_fixture_rt7');
  });
});
