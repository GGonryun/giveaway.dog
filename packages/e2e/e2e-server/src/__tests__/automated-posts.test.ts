import { beforeEach, describe, expect, it } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { Prisma } from '@giveaway/db-model';
import { e2eAutomatedPostsRequestSchema } from '@giveaway/e2e-model/extras';
import {
  seedE2eAutomatedPosts,
  toE2eAutomatedPostText
} from '../automated-posts';
import { NOW, realUser, teamRow } from './fixtures';

const db = asPrismaClient();

const seed = (post: Record<string, unknown> = {}) =>
  seedE2eAutomatedPosts({
    db,
    request: e2eAutomatedPostsRequestSchema.parse({
      sweepstakesId: 'sw-1',
      posts: [{ type: 'POST_TO_BLUESKY', ...post }]
    })
  });

beforeEach(() => {
  prismaMock.sweepstakes.findUnique.mockResolvedValue({
    id: 'sw-1',
    team: teamRow()
  });
  prismaMock.sweepstakes.findUniqueOrThrow.mockResolvedValue({
    teamId: 'team-e2e-abc123-w0',
    timing: { startDate: NOW }
  });
  prismaMock.integration.findFirst.mockResolvedValue({ id: 'bsky-1' });
  prismaMock.automatedPostJob.upsert.mockResolvedValue({
    id: 'job-1',
    type: 'POST_TO_BLUESKY',
    status: 'PENDING',
    runAt: NOW
  });
});

describe('seedE2eAutomatedPosts', () => {
  it('schedules the post at the start of the giveaway, with the Bluesky integration of the team', async () => {
    const result = await seed();

    expect(prismaMock.sweepstakes.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'sw-1' },
      select: { teamId: true, timing: { select: { startDate: true } } }
    });
    expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
      where: {
        teamId: 'team-e2e-abc123-w0',
        provider: 'BLUESKY',
        status: 'ACTIVE'
      },
      select: { id: true }
    });
    const data = {
      status: 'PENDING',
      runAt: NOW,
      request: {
        integrationId: 'bsky-1',
        text: toE2eAutomatedPostText('sw-1'),
        tasks: []
      },
      response: Prisma.DbNull
    };
    expect(prismaMock.automatedPostJob.upsert).toHaveBeenCalledWith({
      where: {
        sweepstakesId_type: { sweepstakesId: 'sw-1', type: 'POST_TO_BLUESKY' }
      },
      update: data,
      create: { sweepstakesId: 'sw-1', type: 'POST_TO_BLUESKY', ...data },
      select: { id: true, type: true, status: true, runAt: true }
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      sweepstakesId: 'sw-1',
      posts: [
        { id: 'job-1', type: 'POST_TO_BLUESKY', status: 'PENDING', runAt: NOW }
      ]
    });
  });

  it('names the giveaway in the default text', () => {
    expect(toE2eAutomatedPostText('sw-1')).toBe(
      '[e2e] The scheduled post of sw-1'
    );
  });

  it('uses the text and the status of the request', async () => {
    await seed({ text: 'Hello', status: 'FAILED' });

    expect(prismaMock.automatedPostJob.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: 'FAILED',
          request: expect.objectContaining({ text: 'Hello' })
        })
      })
    );
  });

  it('refuses a giveaway of a team with a member who is not an e2e user', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue({
      id: 'sw-1',
      team: teamRow({ members: [{ role: 'OWNER', user: realUser() }] })
    });

    await expect(seed()).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(prismaMock.automatedPostJob.upsert).not.toHaveBeenCalled();
  });

  it('refuses a giveaway with no start date', async () => {
    prismaMock.sweepstakes.findUniqueOrThrow.mockResolvedValue({
      teamId: 'team-e2e-abc123-w0',
      timing: null
    });

    await expect(seed()).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
      message: 'Sweepstakes sw-1 has no start date'
    });
    expect(prismaMock.automatedPostJob.upsert).not.toHaveBeenCalled();
  });

  it('refuses a team with no active Bluesky integration', async () => {
    prismaMock.integration.findFirst.mockResolvedValue(null);

    await expect(seed()).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
      message: 'Seed an active BLUESKY integration of the team first'
    });
    expect(prismaMock.automatedPostJob.upsert).not.toHaveBeenCalled();
  });
});
