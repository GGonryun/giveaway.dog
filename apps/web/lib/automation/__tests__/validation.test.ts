import { describe, it, expect } from 'vitest';
import { ApplicationError } from '@/lib/errors';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import type { ScheduleAutomatedPostRequest } from '../schemas';
import { validateAutomatedPostRequest } from '../validation';

const blueskyInput: ScheduleAutomatedPostRequest = {
  sweepstakesId: 'sweep-1',
  type: 'POST_TO_BLUESKY',
  request: { integrationId: 'bsky-int', text: 'Hello', tasks: [] }
};

const discordInput: ScheduleAutomatedPostRequest = {
  sweepstakesId: 'sweep-1',
  type: 'POST_TO_DISCORD',
  request: {
    integrationId: 'discord-int',
    channelId: 'channel-1',
    roles: [],
    tasks: []
  }
};

describe('validateAutomatedPostRequest', () => {
  describe('when the request is a bluesky post', () => {
    it('looks up an active bluesky integration owned by the team', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'bsky-int' });

      await validateAutomatedPostRequest({
        db: asPrismaClient(),
        input: blueskyInput,
        teamId: 'team-1'
      });

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'bsky-int',
          teamId: 'team-1',
          provider: 'BLUESKY',
          status: 'ACTIVE'
        }
      });
    });

    it('resolves to undefined when the integration exists', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'bsky-int' });

      await expect(
        validateAutomatedPostRequest({
          db: asPrismaClient(),
          input: blueskyInput,
          teamId: 'team-1'
        })
      ).resolves.toBeUndefined();
    });

    it('throws PRECONDITION_FAILED when the integration is missing', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const promise = validateAutomatedPostRequest({
        db: asPrismaClient(),
        input: blueskyInput,
        teamId: 'team-1'
      });

      await expect(promise).rejects.toBeInstanceOf(ApplicationError);
      await expect(promise).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
        message: 'Bluesky integration not found or not active'
      });
    });
  });

  describe('when the request is a discord post', () => {
    it('looks up an active discord integration owned by the team', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'discord-int' });

      await validateAutomatedPostRequest({
        db: asPrismaClient(),
        input: discordInput,
        teamId: 'team-2'
      });

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'discord-int',
          teamId: 'team-2',
          provider: 'DISCORD',
          status: 'ACTIVE'
        }
      });
    });

    it('resolves to undefined when the integration exists', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'discord-int' });

      await expect(
        validateAutomatedPostRequest({
          db: asPrismaClient(),
          input: discordInput,
          teamId: 'team-2'
        })
      ).resolves.toBeUndefined();
    });

    it('throws PRECONDITION_FAILED when the integration is missing', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      await expect(
        validateAutomatedPostRequest({
          db: asPrismaClient(),
          input: discordInput,
          teamId: 'team-2'
        })
      ).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
        message: 'Discord integration not found or not active'
      });
    });
  });

  describe('when the request type is not supported', () => {
    it('throws an unexpected value error without querying the database', async () => {
      const input = {
        ...blueskyInput,
        type: 'POST_TO_TWITTER'
      } as unknown as ScheduleAutomatedPostRequest;

      await expect(
        validateAutomatedPostRequest({
          db: asPrismaClient(),
          input,
          teamId: 'team-1'
        })
      ).rejects.toThrow('Unexpected value: [object Object]');
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });
  });
});
