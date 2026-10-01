import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { connectTwitch } from '../connect-twitch';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

vi.hoisted(() => {
  vi.stubEnv('TWITCH_CLIENT_ID', 'client-id');
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.test');
});

const NOW = new Date('2026-10-01T12:00:00.000Z');

type ConnectInput = Parameters<typeof connectTwitch>[0];

describe('connectTwitch', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without looking up the team', async () => {
      const result = await connectTwitch({ slug: 'acme' } as ConnectInput);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects a missing slug', async () => {
      const result = await connectTwitch({} as unknown as ConnectInput);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('rejects an unknown feature', async () => {
      const result = await connectTwitch({
        slug: 'acme',
        features: ['POST_TWEETS']
      } as unknown as ConnectInput);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });

  describe('when the team is not found', () => {
    it('returns NOT_FOUND without creating state', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await connectTwitch({ slug: 'acme' } as ConnectInput);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.state.create).not.toHaveBeenCalled();
    });
  });

  describe('when the caller belongs to the team', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue({
        id: 'team-1',
        slug: 'acme'
      });
      prismaMock.state.create.mockResolvedValue({ id: 'state-1' });
    });

    it('looks up the team by slug for the signed in member', async () => {
      await connectTwitch({ slug: 'acme' } as ConnectInput);

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme', members: { some: { userId: TEST_USER.id } } }
      });
    });

    it('stores an oauth state that expires in ten minutes', async () => {
      await connectTwitch({
        slug: 'acme',
        features: ['CHAT_COMMANDS', 'CHANNEL_REDEMPTIONS']
      });

      expect(prismaMock.state.create).toHaveBeenCalledWith({
        data: {
          value: {
            teamId: 'team-1',
            teamSlug: 'acme',
            features: ['CHAT_COMMANDS', 'CHANNEL_REDEMPTIONS']
          },
          expiresAt: new Date('2026-10-01T12:10:00.000Z')
        },
        select: { id: true }
      });
    });

    it('defaults the stored features to chat commands', async () => {
      await connectTwitch({ slug: 'acme' } as ConnectInput);

      expect(prismaMock.state.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            value: {
              teamId: 'team-1',
              teamSlug: 'acme',
              features: ['CHAT_COMMANDS']
            }
          })
        })
      );
    });

    it('returns the twitch authorize url', async () => {
      const result = await connectTwitch({ slug: 'acme' } as ConnectInput);

      expect(expectOk(result)).toEqual({
        authUrl:
          'https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=client-id&redirect_uri=https%3A%2F%2Fgiveaway.test%2Fapi%2Ftwitch%2Fcallback&scope=openid+user%3Aread%3Aemail+moderation%3Aread+channel%3Aread%3Aredemptions&state=acme%3Astate-1'
      });
    });

    it('encodes the team slug and state id in the state parameter', async () => {
      const result = await connectTwitch({ slug: 'acme' } as ConnectInput);

      const url = new URL(expectOk(result).authUrl);
      expect(url.searchParams.get('state')).toBe('acme:state-1');
    });

    it('requests the integration scopes', async () => {
      const result = await connectTwitch({ slug: 'acme' } as ConnectInput);

      const url = new URL(expectOk(result).authUrl);
      expect(url.searchParams.get('scope')).toBe(
        'openid user:read:email moderation:read channel:read:redemptions'
      );
    });

    it('uses the slug of the stored team rather than the input', async () => {
      prismaMock.team.findUnique.mockResolvedValue({
        id: 'team-1',
        slug: 'stored-slug'
      });

      const result = await connectTwitch({ slug: 'acme' } as ConnectInput);

      const url = new URL(expectOk(result).authUrl);
      expect(url.searchParams.get('state')).toBe('stored-slug:state-1');
    });

    it('stores the slug of the stored team rather than the input in the state', async () => {
      prismaMock.team.findUnique.mockResolvedValue({
        id: 'team-1',
        slug: 'stored-slug'
      });

      await connectTwitch({ slug: 'acme' } as ConnectInput);

      expect(prismaMock.state.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            value: expect.objectContaining({ teamSlug: 'stored-slug' })
          })
        })
      );
    });

    it('maps a prisma error while storing state to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.state.create.mockRejectedValue(knownRequestError('P2002'));

      const result = await connectTwitch({ slug: 'acme' } as ConnectInput);

      expectFailure(result, 'INTERNAL_SERVER_ERROR');
    });
  });

  describe('when the twitch client id is not configured', () => {
    it('returns INTERNAL_SERVER_ERROR without creating state', async () => {
      vi.resetModules();
      vi.stubEnv('TWITCH_CLIENT_ID', '');
      const isolated = await import('../connect-twitch');
      signIn();
      prismaMock.team.findUnique.mockResolvedValue({
        id: 'team-1',
        slug: 'acme'
      });

      const result = await isolated.connectTwitch({
        slug: 'acme'
      } as ConnectInput);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Twitch OAuth not configured'
      );
      expect(prismaMock.state.create).not.toHaveBeenCalled();
    });
  });
});
