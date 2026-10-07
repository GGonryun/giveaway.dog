import { beforeEach, describe, expect, it } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import {
  deleteE2eRun,
  E2E_TEAM_BATCH,
  E2E_USER_BATCH,
  sweepE2eData
} from '../cleanup';
import { e2eUser, NOW, realUser, teamRow } from './fixtures';

const db = asPrismaClient();

const team = (
  slug: string,
  members = [{ role: 'OWNER', user: e2eUser('host') }]
) => ({
  ...teamRow({ slug, members }),
  sweepstakes: [{ id: `sw-${slug}` }]
});

const user = (email: string, teams: string[] = []) => ({
  id: `id-${email}`,
  email,
  teams: teams.map((slug) => ({ team: { slug } }))
});

beforeEach(() => {
  prismaMock.team.findMany.mockResolvedValue([]);
  prismaMock.user.findMany.mockResolvedValue([]);
});

describe('deleteE2eRun', () => {
  it('looks only for the teams and users of the run', async () => {
    await deleteE2eRun({ db, runId: 'abc123' });

    expect(prismaMock.team.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { slug: { startsWith: 'e2e-' } },
          { slug: { startsWith: 'e2e-abc123' } }
        ]
      },
      select: {
        id: true,
        slug: true,
        members: { select: { user: { select: { email: true } } } },
        sweepstakes: { select: { id: true } }
      },
      orderBy: { createdAt: 'asc' },
      take: E2E_TEAM_BATCH + 1
    });
    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { email: { startsWith: 'e2e-', endsWith: '@example.com' } },
          { NOT: { email: 'e2e-host@example.com' } },
          { email: { contains: '-abc123' } }
        ]
      },
      select: {
        id: true,
        email: true,
        teams: { select: { team: { select: { slug: true } } } }
      },
      orderBy: { createdAt: 'asc' },
      take: E2E_USER_BATCH + 1
    });
  });

  it('deletes the picker draws of the teams before the teams', async () => {
    prismaMock.team.findMany.mockResolvedValue([
      team('e2e-abc123-w0'),
      team('e2e-abc123w1-x')
    ]);

    const result = await deleteE2eRun({ db, runId: 'abc123' });

    const ids = ['team-e2e-abc123-w0', 'team-e2e-abc123w1-x'];
    expect(prismaMock.twitterPickerDraw.deleteMany).toHaveBeenCalledWith({
      where: { picker: { teamId: { in: ids } } }
    });
    expect(prismaMock.team.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ids } }
    });
    expect(prismaMock.$transaction).toHaveBeenCalledWith([
      prismaMock.twitterPickerDraw.deleteMany.mock.results[0].value,
      prismaMock.team.deleteMany.mock.results[0].value
    ]);
    expect(result.teams).toEqual({
      deleted: ['e2e-abc123-w0', 'e2e-abc123w1-x'],
      refused: []
    });
    expect(result.sweepstakes).toEqual({ deleted: 2 });
  });

  it('refuses a team with a member who is not an e2e user', async () => {
    prismaMock.team.findMany.mockResolvedValue([
      team('e2e-abc123-w0'),
      team('e2e-abc123-w1', [
        { role: 'OWNER', user: e2eUser('host') },
        { role: 'MEMBER', user: realUser() }
      ])
    ]);

    const result = await deleteE2eRun({ db, runId: 'abc123' });

    expect(prismaMock.team.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['team-e2e-abc123-w0'] } }
    });
    expect(result.teams).toEqual({
      deleted: ['e2e-abc123-w0'],
      refused: ['e2e-abc123-w1']
    });
  });

  it('deletes the persona users of the run only', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      user('e2e-host-abc123@example.com'),
      user('e2e-participant-abc123w0c1@example.com'),
      user('e2e-host-xabc123@example.com')
    ]);

    const result = await deleteE2eRun({ db, runId: 'abc123' });

    expect(prismaMock.user.deleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: [
            'id-e2e-host-abc123@example.com',
            'id-e2e-participant-abc123w0c1@example.com'
          ]
        }
      }
    });
    expect(result.users).toEqual({ deleted: 2, refused: [] });
  });

  it('refuses a user who is a member of a team outside e2e', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      user('e2e-host-abc123@example.com', ['e2e-abc123-w0']),
      user('e2e-admin-abc123@example.com', ['acme'])
    ]);

    const result = await deleteE2eRun({ db, runId: 'abc123' });

    expect(prismaMock.user.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['id-e2e-host-abc123@example.com'] } }
    });
    expect(result.users).toEqual({
      deleted: 1,
      refused: ['e2e-admin-abc123@example.com']
    });
  });

  it('deletes nothing when nothing belongs to the run', async () => {
    const result = await deleteE2eRun({ db, runId: 'abc123' });

    expect(prismaMock.team.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.user.deleteMany).not.toHaveBeenCalled();
    expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    expect(result).toEqual({
      runId: 'abc123',
      teams: { deleted: [], refused: [] },
      sweepstakes: { deleted: 0 },
      users: { deleted: 0, refused: [] },
      more: false
    });
  });

  it('reports more when a batch is full', async () => {
    prismaMock.team.findMany.mockResolvedValue(
      Array.from({ length: E2E_TEAM_BATCH + 1 }, (_, i) =>
        team(`e2e-abc123-${i}`)
      )
    );

    const result = await deleteE2eRun({ db, runId: 'abc123' });

    expect(result.more).toBe(true);
    expect(result.teams.deleted).toHaveLength(E2E_TEAM_BATCH);
  });

  it('reports no more when a batch is exactly full', async () => {
    prismaMock.team.findMany.mockResolvedValue(
      Array.from({ length: E2E_TEAM_BATCH }, (_, i) => team(`e2e-abc123-${i}`))
    );
    prismaMock.user.findMany.mockResolvedValue(
      Array.from({ length: E2E_USER_BATCH }, (_, i) =>
        user(`e2e-host-abc123u${i}@example.com`)
      )
    );

    const result = await deleteE2eRun({ db, runId: 'abc123' });

    expect(result.more).toBe(false);
    expect(result.teams.deleted).toHaveLength(E2E_TEAM_BATCH);
    expect(result.users.deleted).toBe(E2E_USER_BATCH);
  });

  it('deletes one batch of users and reports more when more are left', async () => {
    prismaMock.user.findMany.mockResolvedValue(
      Array.from({ length: E2E_USER_BATCH + 1 }, (_, i) =>
        user(`e2e-host-abc123u${i}@example.com`)
      )
    );

    const result = await deleteE2eRun({ db, runId: 'abc123' });

    expect(result.more).toBe(true);
    expect(result.users.deleted).toBe(E2E_USER_BATCH);
    const [{ where }] = prismaMock.user.deleteMany.mock.calls[0];
    expect(where.id.in).toHaveLength(E2E_USER_BATCH);
    expect(where.id.in).not.toContain(
      `id-e2e-host-abc123u${E2E_USER_BATCH}@example.com`
    );
  });

  it('expires the cache tags of the deleted giveaways', async () => {
    prismaMock.team.findMany.mockResolvedValue([team('e2e-abc123-w0')]);

    await deleteE2eRun({ db, runId: 'abc123' });

    expect(nextCacheMock.revalidateTag).toHaveBeenCalledWith(
      'sweepstakes-sw-e2e-abc123-w0',
      {
        expire: 0
      }
    );
    expect(nextCacheMock.revalidateTag).toHaveBeenCalledWith(
      'public-sweepstakes-list',
      {
        expire: 0
      }
    );
  });
});

describe('sweepE2eData', () => {
  const BEFORE = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);

  it('looks for e2e teams and users older than 24 hours', async () => {
    const result = await sweepE2eData({ db, now: NOW });

    expect(prismaMock.team.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [{ slug: { startsWith: 'e2e-' } }, { createdAt: { lt: BEFORE } }]
        }
      })
    );
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { email: { startsWith: 'e2e-', endsWith: '@example.com' } },
            { NOT: { email: 'e2e-host@example.com' } },
            { createdAt: { lt: BEFORE } }
          ]
        }
      })
    );
    expect(result.before).toEqual(BEFORE);
  });

  it('never deletes a user whose email has no namespace', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      user('e2e-host@example.com'),
      user('e2e-host-old123@example.com')
    ]);

    await sweepE2eData({ db, now: NOW });

    expect(prismaMock.user.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['id-e2e-host-old123@example.com'] } }
    });
  });
});
