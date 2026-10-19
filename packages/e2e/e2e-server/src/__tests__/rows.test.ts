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
    expect(prismaMock.sweepstakes.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'sw-1' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        team: { select: { slug: true } },
        details: { select: { name: true } },
        timing: { select: { startDate: true, endDate: true, timeZone: true } },
        visibility: { select: { visibility: true, slug: true } },
        _count: { select: { participants: true, tasks: true, prizes: true } }
      }
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
    expect(prismaMock.sweepstakesParticipant.findMany).toHaveBeenCalledWith({
      where: { sweepstakesId: 'sw-1' },
      select: {
        id: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
        _count: { select: { taskCompletions: true } }
      },
      orderBy: { createdAt: 'asc' },
      take: 500
    });
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
    expect(prismaMock.sweepstakesJob.findMany).toHaveBeenCalledWith({
      where: { sweepstakesId: 'sw-1' },
      select: { type: true, status: true, runAt: true },
      orderBy: { type: 'asc' },
      take: 500
    });
  });

  it('reads the completions of a giveaway, with a count for each status', async () => {
    ownedGiveaway();
    prismaMock.taskCompletion.findMany.mockResolvedValue([
      {
        id: 'c-1',
        taskId: 't-1',
        status: 'COMPLETED',
        reason: null,
        completedAt: NOW,
        participant: { id: 'p-1', user: e2eUser('participant') }
      },
      {
        id: 'c-2',
        taskId: 't-1',
        status: 'REJECTED',
        reason: 'Bot',
        completedAt: NOW,
        participant: { id: 'p-2', user: realUser() }
      },
      {
        id: 'c-3',
        taskId: 't-2',
        status: 'COMPLETED',
        reason: null,
        completedAt: NOW,
        participant: { id: 'p-1', user: e2eUser('participant') }
      }
    ]);

    expect(
      await readE2eRows({ db, query: { view: 'completions', id: 'sw-1' } })
    ).toEqual({
      byStatus: { COMPLETED: 2, REJECTED: 1 },
      completions: [
        {
          id: 'c-1',
          taskId: 't-1',
          status: 'COMPLETED',
          reason: null,
          completedAt: NOW,
          participantId: 'p-1',
          userId: 'user-participant',
          email: 'e2e-participant-abc123@example.com'
        },
        {
          id: 'c-2',
          taskId: 't-1',
          status: 'REJECTED',
          reason: 'Bot',
          completedAt: NOW,
          participantId: 'p-2',
          userId: 'user-real',
          email: null
        },
        {
          id: 'c-3',
          taskId: 't-2',
          status: 'COMPLETED',
          reason: null,
          completedAt: NOW,
          participantId: 'p-1',
          userId: 'user-participant',
          email: 'e2e-participant-abc123@example.com'
        }
      ]
    });
    expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
      where: { task: { sweepstakesId: 'sw-1' } },
      select: {
        id: true,
        taskId: true,
        status: true,
        reason: true,
        completedAt: true,
        participant: {
          select: { id: true, user: { select: { id: true, email: true } } }
        }
      },
      orderBy: [{ completedAt: 'asc' }, { id: 'asc' }],
      take: 500
    });
  });

  it('reads the draws of a giveaway, with a count for each result', async () => {
    ownedGiveaway();
    prismaMock.prizeDraw.findMany.mockResolvedValue([
      {
        id: 'd-1',
        prizeId: 'prize-1',
        result: 'DISQUALIFIED',
        disqualificationReason: 'Bot',
        previousDrawId: null,
        createdAt: NOW,
        taskCompletion: {
          id: 'c-1',
          participant: { id: 'p-1', user: realUser() }
        }
      },
      {
        id: 'd-2',
        prizeId: 'prize-1',
        result: 'WINNER',
        disqualificationReason: null,
        previousDrawId: 'd-1',
        createdAt: NOW,
        taskCompletion: {
          id: 'c-2',
          participant: { id: 'p-2', user: e2eUser('participant2') }
        }
      }
    ]);

    expect(
      await readE2eRows({ db, query: { view: 'draws', id: 'sw-1' } })
    ).toEqual({
      byResult: { DISQUALIFIED: 1, WINNER: 1 },
      draws: [
        {
          id: 'd-1',
          prizeId: 'prize-1',
          result: 'DISQUALIFIED',
          disqualificationReason: 'Bot',
          previousDrawId: null,
          createdAt: NOW,
          completionId: 'c-1',
          participantId: 'p-1',
          userId: 'user-real',
          email: null
        },
        {
          id: 'd-2',
          prizeId: 'prize-1',
          result: 'WINNER',
          disqualificationReason: null,
          previousDrawId: 'd-1',
          createdAt: NOW,
          completionId: 'c-2',
          participantId: 'p-2',
          userId: 'user-participant2',
          email: 'e2e-participant2-abc123@example.com'
        }
      ]
    });
    expect(prismaMock.prizeDraw.findMany).toHaveBeenCalledWith({
      where: { prize: { sweepstakesId: 'sw-1' } },
      select: {
        id: true,
        prizeId: true,
        result: true,
        disqualificationReason: true,
        previousDrawId: true,
        createdAt: true,
        taskCompletion: {
          select: {
            id: true,
            participant: {
              select: { id: true, user: { select: { id: true, email: true } } }
            }
          }
        }
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 500
    });
  });

  it.each(['completions', 'draws'] as const)(
    'refuses the %s of a giveaway outside e2e',
    async (view) => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        id: 'sw-1',
        team: teamRow({ slug: 'acme' })
      });

      await expect(
        readE2eRows({ db, query: { view, id: 'sw-1' } })
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
      expect(prismaMock.prizeDraw.findMany).not.toHaveBeenCalled();
    }
  );

  it('reads the accounts of a persona', async () => {
    const user = {
      id: 'user-participant',
      email: 'e2e-participant-abc123p1@example.com',
      source: 'TWITTER_IMPORT',
      emailVerified: null,
      accounts: [
        {
          provider: 'google',
          providerAccountId: 'e2e-participant-abc123p1',
          status: 'ACTIVE',
          scope: '',
          label: 'x'
        }
      ]
    };
    prismaMock.user.findUnique.mockResolvedValue(user);

    expect(
      await readE2eRows({
        db,
        query: { view: 'accounts', persona: 'participant', ns: 'abc123p1' }
      })
    ).toEqual({
      user: {
        id: 'user-participant',
        email: 'e2e-participant-abc123p1@example.com',
        source: 'TWITTER_IMPORT',
        emailVerified: null
      },
      accounts: user.accounts
    });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'e2e-participant-abc123p1@example.com' },
      select: {
        id: true,
        email: true,
        source: true,
        emailVerified: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            status: true,
            scope: true,
            label: true
          },
          orderBy: { provider: 'asc' }
        }
      }
    });
  });

  it('refuses the accounts of a persona that does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      readE2eRows({
        db,
        query: { view: 'accounts', persona: 'participant', ns: 'abc123p1' }
      })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'User e2e-participant-abc123p1@example.com not found'
    });
  });

  it('refuses a view that does not exist', async () => {
    expect(() =>
      readE2eRows({ db, query: { view: 'users' } as never })
    ).toThrow('Unexpected value');
    expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
  });
});
