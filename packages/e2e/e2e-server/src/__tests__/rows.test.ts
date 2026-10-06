import { describe, expect, it } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { readE2eRows } from '../rows';
import { e2eUser, NOW, realUser, teamRow } from './fixtures';

const db = asPrismaClient();

const ownedGiveaway = () =>
  prismaMock.sweepstakes.findUnique.mockResolvedValue({
    id: 'sw-1',
    team: teamRow()
  });

describe('readE2eRows', () => {
  it('reads the members of an e2e team', async () => {
    prismaMock.team.findUnique.mockResolvedValue(
      teamRow({
        members: [
          { role: 'OWNER', user: e2eUser('host') },
          { role: 'BLOCKED', user: e2eUser('blocked') }
        ]
      })
    );

    expect(
      await readE2eRows({ db, query: { view: 'team', slug: 'e2e-abc123-w0' } })
    ).toEqual({
      team: {
        id: 'team-e2e-abc123-w0',
        slug: 'e2e-abc123-w0',
        name: 'e2e-abc123-w0',
        tier: 'FREE',
        createdAt: NOW
      },
      members: [
        {
          userId: 'user-host',
          email: 'e2e-host-abc123@example.com',
          role: 'OWNER'
        },
        {
          userId: 'user-blocked',
          email: 'e2e-blocked-abc123@example.com',
          role: 'BLOCKED'
        }
      ]
    });
  });

  it('refuses a team with a member who is not an e2e user', async () => {
    prismaMock.team.findUnique.mockResolvedValue(
      teamRow({ members: [{ role: 'OWNER', user: realUser() }] })
    );

    await expect(
      readE2eRows({ db, query: { view: 'team', slug: 'e2e-abc123-w0' } })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('reads a giveaway of an e2e team', async () => {
    ownedGiveaway();
    const row = { id: 'sw-1', status: 'ACTIVE' };
    prismaMock.sweepstakes.findUniqueOrThrow.mockResolvedValue(row);

    expect(
      await readE2eRows({ db, query: { view: 'sweepstakes', id: 'sw-1' } })
    ).toEqual({
      sweepstakes: row
    });
  });

  it.each(['sweepstakes', 'participants', 'jobs'] as const)(
    'does not read the %s of a giveaway outside e2e',
    async (view) => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        id: 'sw-1',
        team: teamRow({
          slug: 'acme',
          members: [{ role: 'OWNER', user: realUser() }]
        })
      });

      await expect(
        readE2eRows({ db, query: { view, id: 'sw-1' } })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND'
      });
      expect(prismaMock.sweepstakes.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakesParticipant.findMany).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakesJob.findMany).not.toHaveBeenCalled();
    }
  );

  it('reads the participants and hides the email of a user who is not an e2e user', async () => {
    ownedGiveaway();
    prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([
      {
        id: 'p-1',
        createdAt: NOW,
        user: e2eUser('participant'),
        _count: { taskCompletions: 2 }
      },
      {
        id: 'p-2',
        createdAt: NOW,
        user: realUser(),
        _count: { taskCompletions: 0 }
      }
    ]);

    expect(
      await readE2eRows({ db, query: { view: 'participants', id: 'sw-1' } })
    ).toEqual({
      participants: [
        {
          id: 'p-1',
          createdAt: NOW,
          userId: 'user-participant',
          email: 'e2e-participant-abc123@example.com',
          completions: 2
        },
        {
          id: 'p-2',
          createdAt: NOW,
          userId: 'user-real',
          email: null,
          completions: 0
        }
      ]
    });
    expect(prismaMock.sweepstakesParticipant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sweepstakesId: 'sw-1' }, take: 500 })
    );
  });

  it('reads the jobs of a giveaway', async () => {
    ownedGiveaway();
    const jobs = [
      { type: 'PROCESS_EXPIRATION', status: 'PENDING', runAt: NOW }
    ];
    prismaMock.sweepstakesJob.findMany.mockResolvedValue(jobs);

    expect(
      await readE2eRows({ db, query: { view: 'jobs', id: 'sw-1' } })
    ).toEqual({ jobs });
    expect(prismaMock.sweepstakesJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sweepstakesId: 'sw-1' } })
    );
  });
});
