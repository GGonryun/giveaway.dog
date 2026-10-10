import { beforeEach, describe, expect, it } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { e2eIntegrationsRequestSchema } from '@giveaway/e2e-model/extras';
import {
  E2E_INTEGRATION_SCOPES,
  seedE2eIntegrations,
  toE2eIntegrationSettings
} from '../integrations';
import { e2eUser, realUser, teamRow } from './fixtures';

const db = asPrismaClient();

const seed = (integrations: Record<string, unknown>[]) =>
  seedE2eIntegrations({
    db,
    request: e2eIntegrationsRequestSchema.parse({
      team: 'e2e-abc123-w0',
      integrations
    })
  });

beforeEach(() => {
  prismaMock.team.findUnique.mockResolvedValue(teamRow());
  prismaMock.integration.findMany.mockResolvedValue([{ id: 'i-1' }]);
});

describe('E2E_INTEGRATION_SCOPES', () => {
  it('gives each provider every scope that the app asks for', () => {
    expect(E2E_INTEGRATION_SCOPES.TWITTER).toEqual(
      expect.arrayContaining(['tweet.read', 'users.read', 'offline.access'])
    );
    expect(E2E_INTEGRATION_SCOPES.BLUESKY).toEqual([
      'atproto',
      'transition:generic'
    ]);
    expect(E2E_INTEGRATION_SCOPES.TWITCH).toEqual([
      'user:read:email',
      'moderation:read',
      'channel:read:redemptions'
    ]);
    expect(E2E_INTEGRATION_SCOPES.DISCORD).toEqual([]);
    expect(new Set(E2E_INTEGRATION_SCOPES.TWITTER).size).toBe(
      E2E_INTEGRATION_SCOPES.TWITTER.length
    );
  });
});

describe('toE2eIntegrationSettings', () => {
  it('gives Twitch the settings that the app reads, and the others none', () => {
    expect(toE2eIntegrationSettings('TWITCH', 'e2e-abc123-w0')).toEqual({
      broadcasterId: 'e2e-abc123-w0',
      broadcasterLogin: 'e2e_abc123_w0',
      broadcasterDisplayName: 'e2e_abc123_w0',
      channelUrl: 'https://www.twitch.tv/e2e_abc123_w0'
    });
    expect(toE2eIntegrationSettings('TWITTER', 'e2e-abc123-w0')).toEqual({});
    expect(toE2eIntegrationSettings('DISCORD', 'e2e-abc123-w0')).toEqual({});
  });
});

describe('seedE2eIntegrations', () => {
  it('replaces the integrations of the team for the given providers, owned by the team owner', async () => {
    const result = await seed([
      { provider: 'TWITCH' },
      {
        provider: 'TWITTER',
        status: 'ERROR',
        label: 'e2e_x',
        scopes: ['tweet.read'],
        settings: { a: 1 }
      }
    ]);

    expect(prismaMock.integration.deleteMany).toHaveBeenCalledWith({
      where: {
        teamId: 'team-e2e-abc123-w0',
        provider: { in: ['TWITCH', 'TWITTER'] }
      }
    });
    expect(prismaMock.integration.createMany).toHaveBeenCalledWith({
      data: [
        {
          provider: 'TWITCH',
          teamId: 'team-e2e-abc123-w0',
          ownerId: 'user-host',
          account_id: 'e2e-abc123-w0-twitch',
          status: 'ACTIVE',
          label: 'e2e_abc123_w0',
          scope: 'user:read:email moderation:read channel:read:redemptions',
          token_type: 'bearer',
          settings: toE2eIntegrationSettings('TWITCH', 'e2e-abc123-w0')
        },
        {
          provider: 'TWITTER',
          teamId: 'team-e2e-abc123-w0',
          ownerId: 'user-host',
          account_id: 'e2e-abc123-w0-twitter',
          status: 'ERROR',
          label: 'e2e_x',
          scope: 'tweet.read',
          token_type: 'bearer',
          settings: { a: 1 }
        }
      ]
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.integration.findMany).toHaveBeenCalledWith({
      where: {
        teamId: 'team-e2e-abc123-w0',
        provider: { in: ['TWITCH', 'TWITTER'] }
      },
      select: {
        id: true,
        provider: true,
        account_id: true,
        status: true,
        label: true,
        scope: true,
        settings: true
      },
      orderBy: { provider: 'asc' }
    });
    expect(result).toEqual({
      team: 'e2e-abc123-w0',
      integrations: [{ id: 'i-1' }]
    });
  });

  it('refuses a team with a member who is not an e2e user, and writes nothing', async () => {
    prismaMock.team.findUnique.mockResolvedValue(
      teamRow({
        members: [
          { role: 'OWNER', user: e2eUser('host') },
          { role: 'MEMBER', user: realUser() }
        ]
      })
    );

    await expect(seed([{ provider: 'DISCORD' }])).rejects.toMatchObject({
      code: 'FORBIDDEN'
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('refuses a team with no owner', async () => {
    prismaMock.team.findUnique.mockResolvedValue(
      teamRow({ members: [{ role: 'ADMIN', user: e2eUser('admin') }] })
    );

    await expect(seed([{ provider: 'DISCORD' }])).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
      message: 'Team e2e-abc123-w0 has no owner'
    });
  });
});
