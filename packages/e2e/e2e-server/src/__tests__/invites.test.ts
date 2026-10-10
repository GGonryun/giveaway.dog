import { beforeEach, describe, expect, it } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { e2eInvitesRequestSchema } from '@giveaway/e2e-model/extras';
import { seedE2eInvites } from '../invites';
import { e2eUser, NOW, realUser, teamRow } from './fixtures';

const db = asPrismaClient();

const seed = (request: Record<string, unknown>) =>
  seedE2eInvites({
    db,
    request: e2eInvitesRequestSchema.parse({
      ns: 'abc123w0',
      team: 'e2e-abc123-w0',
      ...request
    }),
    now: NOW
  });

beforeEach(() => {
  prismaMock.team.findUnique.mockResolvedValue(teamRow());
  prismaMock.teamInviteEmail.upsert.mockImplementation((async (args: {
    create: { email: string; role: string };
  }) => ({
    id: `invite-${args.create.email}`,
    email: args.create.email,
    role: args.create.role
  })) as never);
  prismaMock.teamInviteLink.upsert.mockResolvedValue({
    id: 'link-1',
    expiresAt: null
  });
});

describe('seedE2eInvites', () => {
  it('invites the email of each persona with its role, and keeps the link', async () => {
    const result = await seed({
      emails: [
        { persona: 'admin', role: 'ADMIN' },
        { persona: 'guest', ns: 'abc123p1', role: 'GUEST' }
      ]
    });

    expect(prismaMock.teamInviteEmail.upsert).toHaveBeenNthCalledWith(1, {
      where: {
        teamId_email: {
          teamId: 'team-e2e-abc123-w0',
          email: 'e2e-admin-abc123w0@example.com'
        }
      },
      update: { role: 'ADMIN' },
      create: {
        teamId: 'team-e2e-abc123-w0',
        email: 'e2e-admin-abc123w0@example.com',
        role: 'ADMIN'
      },
      select: { id: true, email: true, role: true }
    });
    expect(prismaMock.teamInviteEmail.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        create: {
          teamId: 'team-e2e-abc123-w0',
          email: 'e2e-guest-abc123p1@example.com',
          role: 'GUEST'
        }
      })
    );
    expect(prismaMock.teamInviteLink.upsert).not.toHaveBeenCalled();
    expect(result).toEqual({
      team: 'e2e-abc123-w0',
      emails: [
        {
          id: 'invite-e2e-admin-abc123w0@example.com',
          email: 'e2e-admin-abc123w0@example.com',
          role: 'ADMIN'
        },
        {
          id: 'invite-e2e-guest-abc123p1@example.com',
          email: 'e2e-guest-abc123p1@example.com',
          role: 'GUEST'
        }
      ],
      link: null
    });
  });

  it.each([
    [-60, new Date(NOW.getTime() - 60_000)],
    [3600, new Date(NOW.getTime() + 3_600_000)],
    [0, NOW],
    [null, null]
  ])(
    'gives the invite link an expiry %s seconds from now',
    async (expiresIn, expiresAt) => {
      const result = await seed({ link: { expiresIn } });

      expect(prismaMock.teamInviteLink.upsert).toHaveBeenCalledWith({
        where: { teamId: 'team-e2e-abc123-w0' },
        update: { expiresAt },
        create: { teamId: 'team-e2e-abc123-w0', expiresAt },
        select: { id: true, expiresAt: true }
      });
      expect(result.link).toEqual({ id: 'link-1', expiresAt: null });
    }
  );

  it('writes inside one transaction', async () => {
    await seed({ link: {} });

    expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function));
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

    await expect(seed({ link: {} })).rejects.toMatchObject({
      code: 'FORBIDDEN'
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
