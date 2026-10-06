import { beforeEach, describe, expect, it } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { e2eTeamRequestSchema } from '@giveaway/e2e-model/requests';
import { seedE2eTeam } from '../teams';
import { e2eUser, NOW, realUser, teamRow } from './fixtures';

const db = asPrismaClient();

const TEAM = {
  id: 'team-1',
  slug: 'e2e-abc123-w0',
  name: 'e2e-abc123-w0',
  tier: 'FREE'
};

const seed = (request: Record<string, unknown>) =>
  seedE2eTeam({
    db,
    request: e2eTeamRequestSchema.parse({
      ns: 'abc123',
      suffix: 'w0',
      ...request
    }),
    now: NOW
  });

beforeEach(() => {
  prismaMock.team.findUnique.mockResolvedValue(null);
  prismaMock.team.upsert.mockResolvedValue(TEAM);
  prismaMock.user.upsert.mockImplementation(
    async (args: { where: { email: string } }) => ({
      id: `id-${args.where.email}`,
      email: args.where.email
    })
  );
});

describe('seedE2eTeam', () => {
  it('creates the team with the e2e slug, outside the team limit', async () => {
    const result = await seed({ tier: 'PRO' });

    expect(prismaMock.team.upsert).toHaveBeenCalledWith({
      where: { slug: 'e2e-abc123-w0' },
      update: { tier: 'PRO' },
      create: {
        slug: 'e2e-abc123-w0',
        name: 'e2e-abc123-w0',
        tier: 'PRO',
        logo: expect.any(String)
      },
      select: { id: true, slug: true, name: true, tier: true }
    });
    expect(prismaMock.membership.count).not.toHaveBeenCalled();
    expect(result).toMatchObject({ created: true, team: TEAM });
  });

  it('signs up each persona with its computed email and gives it its role', async () => {
    const result = await seed({
      owner: 'host',
      members: [
        { persona: 'admin', role: 'ADMIN' },
        { persona: 'blocked', role: 'BLOCKED' }
      ]
    });

    expect(
      prismaMock.user.upsert.mock.calls.map(([args]) => args.where)
    ).toEqual([
      { email: 'e2e-host-abc123@example.com' },
      { email: 'e2e-admin-abc123@example.com' },
      { email: 'e2e-blocked-abc123@example.com' }
    ]);
    expect(prismaMock.membership.upsert).toHaveBeenCalledWith({
      where: {
        userId_teamId: {
          userId: 'id-e2e-blocked-abc123@example.com',
          teamId: 'team-1'
        }
      },
      update: { role: 'BLOCKED' },
      create: {
        userId: 'id-e2e-blocked-abc123@example.com',
        teamId: 'team-1',
        role: 'BLOCKED'
      }
    });
    expect(result.users).toEqual({
      host: {
        id: 'id-e2e-host-abc123@example.com',
        email: 'e2e-host-abc123@example.com',
        role: 'OWNER'
      },
      admin: {
        id: 'id-e2e-admin-abc123@example.com',
        email: 'e2e-admin-abc123@example.com',
        role: 'ADMIN'
      },
      blocked: {
        id: 'id-e2e-blocked-abc123@example.com',
        email: 'e2e-blocked-abc123@example.com',
        role: 'BLOCKED'
      }
    });
  });

  it('writes inside one transaction', async () => {
    await seed({});

    expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function));
  });

  it('updates an existing e2e team, so a restarted worker gets its team back', async () => {
    prismaMock.team.findUnique.mockResolvedValue(
      teamRow({ members: [{ role: 'OWNER', user: e2eUser('host') }] })
    );

    const result = await seed({ name: 'Renamed' });

    expect(prismaMock.team.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { tier: 'FREE', name: 'Renamed' } })
    );
    expect(result.created).toBe(false);
  });

  it('refuses an existing team with a member who is not an e2e user, and writes nothing', async () => {
    prismaMock.team.findUnique.mockResolvedValue(
      teamRow({
        members: [
          { role: 'OWNER', user: e2eUser('host') },
          { role: 'ADMIN', user: realUser() }
        ]
      })
    );

    await expect(seed({})).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.user.upsert).not.toHaveBeenCalled();
    expect(prismaMock.team.upsert).not.toHaveBeenCalled();
  });
});
