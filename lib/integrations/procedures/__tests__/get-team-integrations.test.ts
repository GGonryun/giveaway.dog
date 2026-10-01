import { describe, it, expect, beforeEach } from 'vitest';
import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import { getTeamIntegrations } from '../get-team-integrations';
import { prismaMock } from '@/test/prisma';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

type IntegrationRow = {
  id: string;
  provider: IntegrationProvider;
  account_id: string | null;
  label: string | null;
  status: IntegrationStatus;
  scope: string | null;
  settings: unknown;
  access_token?: string | null;
  state: { id: string; value: unknown; expiresAt: Date | null } | null;
  subscriptions: Record<string, unknown>[];
};

const integration = (overrides: Partial<IntegrationRow> = {}) => ({
  id: 'int-1',
  provider: IntegrationProvider.TWITTER,
  account_id: 'acct-1',
  label: 'acme_dog',
  status: IntegrationStatus.ACTIVE,
  scope: 'tweet.read users.read',
  settings: null,
  access_token: 'secret-token',
  state: null,
  subscriptions: [],
  ...overrides
});

const subscription = {
  id: 'sub-1',
  twitch_id: 'tw-sub-1',
  integrationId: 'int-1',
  type: 'channel.chat.message',
  version: '1',
  status: 'enabled',
  broadcaster_user_id: 'b-1',
  cost: 0,
  callback: 'https://giveaway.test/api/twitch',
  method: 'webhook',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  last_event_received_at: null
};

const withIntegrations = (integrations: ReturnType<typeof integration>[]) => {
  prismaMock.team.findUnique.mockResolvedValue({ id: 'team-1', integrations });
};

describe('getTeamIntegrations', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without querying teams', async () => {
      const result = await getTeamIntegrations({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects a non-string slug', async () => {
      const result = await getTeamIntegrations({
        slug: 42
      } as unknown as Parameters<typeof getTeamIntegrations>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('queries the team by slug alone with integration state and subscriptions', async () => {
      withIntegrations([]);

      await getTeamIntegrations({ slug: 'acme' });

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme' },
        select: {
          id: true,
          integrations: {
            include: { state: true, subscriptions: true }
          }
        }
      });
    });

    it('returns NOT_FOUND when the team does not exist', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await getTeamIntegrations({ slug: 'missing' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
    });

    it('returns an empty list for a team without integrations', async () => {
      withIntegrations([]);

      const result = await getTeamIntegrations({ slug: 'acme' });

      expect(expectOk(result)).toEqual([]);
    });

    it('maps a twitter integration to the public shape without tokens', async () => {
      withIntegrations([integration()]);

      const result = await getTeamIntegrations({ slug: 'acme' });

      expect(expectOk(result)).toEqual([
        {
          id: 'int-1',
          provider: IntegrationProvider.TWITTER,
          url: 'https://x.com/acme_dog',
          account_id: 'acct-1',
          label: 'acme_dog',
          status: IntegrationStatus.ACTIVE,
          scopes: ['tweet.read', 'users.read'],
          settings: null,
          state: null,
          subscriptions: []
        }
      ]);
    });

    it('builds a bluesky profile url from the label', async () => {
      withIntegrations([
        integration({
          provider: IntegrationProvider.BLUESKY,
          label: 'acme.bsky.social'
        })
      ]);

      const [mapped] = expectOk(await getTeamIntegrations({ slug: 'acme' }));

      expect(mapped.url).toBe('https://bsky.app/profile/acme.bsky.social');
    });

    it('returns a null url for providers without a profile url', async () => {
      withIntegrations([
        integration({ id: 'int-d', provider: IntegrationProvider.DISCORD }),
        integration({ id: 'int-t', provider: IntegrationProvider.TWITCH })
      ]);

      const mapped = expectOk(await getTeamIntegrations({ slug: 'acme' }));

      expect(mapped.map((i) => i.url)).toEqual([null, null]);
    });

    it('falls back to the default label and a null url when the label is missing', async () => {
      withIntegrations([integration({ label: null })]);

      const [mapped] = expectOk(await getTeamIntegrations({ slug: 'acme' }));

      expect(mapped.label).toBe('MISSING_NO');
      expect(mapped.url).toBeNull();
    });

    it('returns no scopes when the scope column is null', async () => {
      withIntegrations([integration({ scope: null })]);

      const [mapped] = expectOk(await getTeamIntegrations({ slug: 'acme' }));

      expect(mapped.scopes).toEqual([]);
    });

    it('returns no scopes when the scope column is an empty string', async () => {
      withIntegrations([integration({ scope: '' })]);

      const [mapped] = expectOk(await getTeamIntegrations({ slug: 'acme' }));

      expect(mapped.scopes).toEqual([]);
    });

    it('keeps empty entries produced by repeated spaces in the scope', async () => {
      withIntegrations([integration({ scope: 'a  b' })]);

      const [mapped] = expectOk(await getTeamIntegrations({ slug: 'acme' }));

      expect(mapped.scopes).toEqual(['a', '', 'b']);
    });

    it('passes settings, state and subscriptions through unchanged', async () => {
      const state = {
        id: 'state-1',
        value: { teamId: 'team-1', codeVerifier: 'v' },
        expiresAt: new Date('2026-01-01T00:10:00.000Z')
      };
      withIntegrations([
        integration({
          provider: IntegrationProvider.TWITCH,
          settings: { command: '!enter' },
          state,
          subscriptions: [subscription]
        })
      ]);

      const [mapped] = expectOk(await getTeamIntegrations({ slug: 'acme' }));

      expect(mapped.settings).toEqual({ command: '!enter' });
      expect(mapped.state).toBe(state);
      expect(mapped.subscriptions).toEqual([subscription]);
    });

    it('preserves integration order', async () => {
      withIntegrations([
        integration({ id: 'b' }),
        integration({ id: 'a' }),
        integration({ id: 'c' })
      ]);

      const mapped = expectOk(await getTeamIntegrations({ slug: 'acme' }));

      expect(mapped.map((i) => i.id)).toEqual(['b', 'a', 'c']);
    });

    it('returns UNPROCESSABLE_CONTENT when a row has an unknown status', async () => {
      withIntegrations([
        integration({ status: 'DISABLED' as IntegrationStatus })
      ]);

      const result = await getTeamIntegrations({ slug: 'acme' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed: /
      );
    });
  });
});
