import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAuthConfig, type GetSession } from '../config-runtime';
import { authConfigMiddleware } from '../config-middleware';
import { ApplicationError } from '@giveaway/util-errors';
import { DOG_BREEDS } from '../dogs';
import { prismaMock } from '@giveaway/testing-mocks/prisma';
import { createSession } from '@giveaway/testing-mocks/session';

const getSession = vi.fn<GetSession>();

const authConfig = createAuthConfig(getSession);

type LinkAccountArgs = Parameters<typeof authConfig.events.linkAccount>[0];
type SignInArgs = Parameters<typeof authConfig.callbacks.signIn>[0];

const NOW = new Date('2026-03-04T05:06:07.000Z');

const linkAccount = (args: {
  user?: Record<string, unknown>;
  account?: Record<string, unknown>;
  profile?: Record<string, unknown>;
}) =>
  authConfig.events.linkAccount({
    user: { id: 'u-1', ...args.user },
    account: {
      type: 'oauth',
      provider: 'google',
      providerAccountId: 'g-1',
      ...args.account
    },
    profile: { ...args.profile }
  } as unknown as LinkAccountArgs);

const signIn = (args: Record<string, unknown>) =>
  authConfig.callbacks.signIn({
    user: { id: 'u-1' },
    ...args
  } as unknown as SignInArgs);

const oauthAccount = (overrides: Record<string, unknown> = {}) => ({
  type: 'oauth',
  provider: 'discord',
  providerAccountId: 'd-1',
  ...overrides
});

beforeEach(() => {
  getSession.mockReset();
  getSession.mockResolvedValue(null);
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('authConfig', () => {
  describe('composition', () => {
    it('reuses the middleware pages, session, adapter and logger', () => {
      expect(authConfig.pages).toBe(authConfigMiddleware.pages);
      expect(authConfig.session).toBe(authConfigMiddleware.session);
      expect(authConfig.adapter).toBe(authConfigMiddleware.adapter);
      expect(authConfig.logger).toBe(authConfigMiddleware.logger);
    });

    it('reuses the middleware authorized, jwt and session callbacks', () => {
      expect(authConfig.callbacks.authorized).toBe(
        authConfigMiddleware.callbacks.authorized
      );
      expect(authConfig.callbacks.jwt).toBe(authConfigMiddleware.callbacks.jwt);
      expect(authConfig.callbacks.session).toBe(
        authConfigMiddleware.callbacks.session
      );
    });

    it('adds a signIn callback that the middleware does not have', () => {
      expect('signIn' in authConfigMiddleware.callbacks).toBe(false);
      expect(authConfig.callbacks.signIn).toEqual(expect.any(Function));
    });

    it('does not load the session while it builds the config', () => {
      const getOtherSession = vi.fn<GetSession>();

      createAuthConfig(getOtherSession);

      expect(getOtherSession).not.toHaveBeenCalled();
    });
  });

  describe('events.linkAccount', () => {
    describe('account label and link', () => {
      it('stores the label and link for a google account', async () => {
        await linkAccount({ profile: { email: 'g@example.com' } });

        expect(prismaMock.account.update).toHaveBeenCalledWith({
          where: {
            provider_providerAccountId: {
              provider: 'google',
              providerAccountId: 'g-1'
            }
          },
          data: { label: 'g@example.com', link: 'mailto:g@example.com' }
        });
      });

      it('stores the link when only a link can be derived', async () => {
        await linkAccount({
          account: { provider: 'steam', providerAccountId: '7656' },
          profile: {}
        });

        expect(prismaMock.account.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: {
              label: null,
              link: 'https://steamcommunity.com/profiles/7656'
            }
          })
        );
      });

      it('derives the linkedin label and link from the user profile url', async () => {
        await linkAccount({
          account: { provider: 'linkedin', providerAccountId: 'li-1' },
          user: { linkedInProfileUrl: 'https://www.linkedin.com/in/jane' },
          profile: { name: 'Jane' }
        });

        expect(prismaMock.account.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { label: 'jane', link: 'https://www.linkedin.com/in/jane' }
          })
        );
      });

      it('skips the account update when neither label nor link exist', async () => {
        await linkAccount({
          account: { provider: 'facebook', providerAccountId: 'fb-1' },
          profile: { name: 'Face' }
        });

        expect(prismaMock.account.update).not.toHaveBeenCalled();
      });

      it('runs every write in a single transaction', async () => {
        await linkAccount({ profile: { email: 'g@example.com' } });

        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      });
    });

    it('rejects an unknown provider before writing anything', async () => {
      const result = linkAccount({
        account: { provider: 'myspace', providerAccountId: 'm-1' }
      });

      await expect(result).rejects.toBeInstanceOf(ApplicationError);
      await expect(result).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid auth provider: myspace'
      });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    describe('anonymous user upgrade', () => {
      it('upgrades an anonymous user to a signup user named after the profile', async () => {
        await linkAccount({
          account: { provider: 'twitter', providerAccountId: 't-1' },
          user: { source: 'ANONYMOUS' },
          profile: { name: 'Jack' }
        });

        expect(prismaMock.user.update).toHaveBeenCalledWith({
          where: { id: 'u-1' },
          data: { source: 'SIGNUP', name: 'Jack' }
        });
      });

      it('names the upgraded user after a random dog breed when the profile has no name', async () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);

        await linkAccount({
          account: { provider: 'twitter', providerAccountId: 't-1' },
          user: { source: 'ANONYMOUS' },
          profile: {}
        });

        expect(prismaMock.user.update).toHaveBeenCalledWith({
          where: { id: 'u-1' },
          data: { source: 'SIGNUP', name: DOG_BREEDS[0] }
        });
      });

      it('does not upgrade a user that already signed up', async () => {
        await linkAccount({
          account: { provider: 'twitter', providerAccountId: 't-1' },
          user: { source: 'SIGNUP' },
          profile: { name: 'Jack' }
        });

        expect(prismaMock.user.update).not.toHaveBeenCalled();
      });

      it('does not upgrade a user object without a source', async () => {
        await linkAccount({
          account: { provider: 'twitter', providerAccountId: 't-1' },
          profile: { name: 'Jack' }
        });

        expect(prismaMock.user.update).not.toHaveBeenCalled();
      });

      it('does not touch users without an id', async () => {
        await linkAccount({
          user: { id: undefined, source: 'ANONYMOUS' },
          profile: { email: 'g@example.com', name: 'G' }
        });

        expect(prismaMock.user.update).not.toHaveBeenCalled();
      });
    });

    describe('email verification', () => {
      beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(NOW);
      });

      it.each(['google', 'discord', 'linkedin'])(
        'marks the email verified for the %s provider',
        async (provider) => {
          await linkAccount({
            account: { provider, providerAccountId: 'p-1' },
            profile: { email: 'v@example.com' }
          });

          expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id: 'u-1' },
            data: { emailVerified: NOW }
          });
        }
      );

      it('does not verify the email when the profile has none', async () => {
        await linkAccount({ profile: {} });

        expect(prismaMock.user.update).not.toHaveBeenCalled();
      });

      it.each(['twitter', 'twitch', 'kick', 'tiktok', 'steam', 'bluesky'])(
        'does not verify the email for the %s provider',
        async (provider) => {
          await linkAccount({
            account: { provider, providerAccountId: 'p-1' },
            profile: { email: 'v@example.com' }
          });

          expect(prismaMock.user.update).not.toHaveBeenCalled();
        }
      );

      it('upgrades the anonymous user before verifying the email', async () => {
        await linkAccount({
          user: { source: 'ANONYMOUS' },
          profile: { email: 'v@example.com', name: 'Vee' }
        });

        expect(prismaMock.user.update).toHaveBeenNthCalledWith(1, {
          where: { id: 'u-1' },
          data: { source: 'SIGNUP', name: 'Vee' }
        });
        expect(prismaMock.user.update).toHaveBeenNthCalledWith(2, {
          where: { id: 'u-1' },
          data: { emailVerified: NOW }
        });
      });
    });
  });

  describe('callbacks.signIn', () => {
    describe('when there is nothing to reconcile', () => {
      it('allows sign in without a profile', async () => {
        expect(await signIn({ account: oauthAccount() })).toBe(true);
        expect(prismaMock.account.findUnique).not.toHaveBeenCalled();
        expect(getSession).not.toHaveBeenCalled();
      });

      it('allows sign in without an account', async () => {
        expect(await signIn({ account: null, profile: { id: 'p' } })).toBe(
          true
        );
        expect(prismaMock.account.findUnique).not.toHaveBeenCalled();
      });

      it('allows sign in when the account has no provider account id', async () => {
        expect(
          await signIn({
            account: oauthAccount({ providerAccountId: '' }),
            profile: { id: 'p' }
          })
        ).toBe(true);
        expect(prismaMock.account.findUnique).not.toHaveBeenCalled();
      });
    });

    describe('when the account already exists', () => {
      const existing = (source: string, userId = 'owner') => ({
        provider: 'discord',
        providerAccountId: 'd-1',
        userId,
        user: { id: userId, source, name: 'Owner', email: null }
      });

      it('looks the account up with its user', async () => {
        prismaMock.account.findUnique.mockResolvedValue(existing('SIGNUP'));

        await signIn({ account: oauthAccount(), profile: { id: 'p' } });

        expect(prismaMock.account.findUnique).toHaveBeenCalledWith({
          where: {
            provider_providerAccountId: {
              provider: 'discord',
              providerAccountId: 'd-1'
            }
          },
          include: {
            user: {
              select: { id: true, source: true, name: true, email: true }
            }
          }
        });
      });

      it('allows a reconnect by the owner', async () => {
        prismaMock.account.findUnique.mockResolvedValue(existing('SIGNUP'));
        getSession.mockResolvedValue(createSession({ id: 'owner' }));

        expect(
          await signIn({ account: oauthAccount(), profile: { id: 'p' } })
        ).toBe(true);
      });

      it('refuses when the account belongs to another signed-in user', async () => {
        prismaMock.account.findUnique.mockResolvedValue(existing('SIGNUP'));
        getSession.mockResolvedValue(createSession({ id: 'someone-else' }));

        expect(
          await signIn({ account: oauthAccount(), profile: { id: 'p' } })
        ).toBe(false);
      });

      it('links the account to the user of the session from getSession', async () => {
        prismaMock.account.findUnique.mockResolvedValue(
          existing('DISCORD_IMPORT', 'imported')
        );
        prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([]);
        getSession.mockResolvedValue(createSession({ id: 'current' }));

        await signIn({ account: oauthAccount(), profile: { id: 'p' } });

        expect(getSession).toHaveBeenCalledTimes(1);
        expect(prismaMock.account.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ userId: 'current' })
          })
        );
        expect(
          prismaMock.sweepstakesParticipant.updateMany
        ).toHaveBeenCalledWith({
          where: { userId: 'imported' },
          data: { userId: 'current' }
        });
      });

      it('returns the merge redirect when linking an imported account', async () => {
        prismaMock.account.findUnique.mockResolvedValue(
          existing('DISCORD_IMPORT', 'imported')
        );
        prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([]);
        getSession.mockResolvedValue(createSession({ id: 'current' }));

        expect(
          await signIn({
            account: oauthAccount(),
            profile: { username: 'disc' }
          })
        ).toBe('/account?merged=true');
        expect(prismaMock.user.delete).toHaveBeenCalledWith({
          where: { id: 'imported' }
        });
      });

      it('does not refresh tokens through the new-account path', async () => {
        prismaMock.account.findUnique.mockResolvedValue(existing('SIGNUP'));

        await signIn({
          account: oauthAccount({ access_token: 'new' }),
          profile: { id: 'p' }
        });

        expect(prismaMock.account.update).not.toHaveBeenCalled();
      });
    });

    describe('when the account does not exist yet', () => {
      beforeEach(() => {
        prismaMock.account.findUnique.mockResolvedValue(null);
      });

      it('loads the current session', async () => {
        await signIn({ account: oauthAccount(), profile: { id: 'p' } });

        expect(getSession).toHaveBeenCalledTimes(1);
      });

      it('refreshes the tokens and resets the status to active', async () => {
        const result = await signIn({
          account: oauthAccount({
            scope: 'identify email',
            access_token: 'access',
            refresh_token: 'refresh',
            expires_at: 1700000000,
            token_type: 'bearer'
          }),
          profile: { id: 'p' }
        });

        expect(result).toBe(true);
        expect(prismaMock.account.update).toHaveBeenCalledWith({
          where: {
            provider_providerAccountId: {
              provider: 'discord',
              providerAccountId: 'd-1'
            }
          },
          data: {
            scope: 'identify email',
            access_token: 'access',
            refresh_token: 'refresh',
            expires_at: 1700000000,
            status: 'ACTIVE'
          }
        });
      });

      it('only resets the status when the account carries no tokens', async () => {
        await signIn({ account: oauthAccount(), profile: { id: 'p' } });

        expect(prismaMock.account.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { status: 'ACTIVE' } })
        );
      });

      it('omits a zero expiry from the update', async () => {
        await signIn({
          account: oauthAccount({ expires_at: 0, access_token: 'a' }),
          profile: { id: 'p' }
        });

        expect(prismaMock.account.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { access_token: 'a', status: 'ACTIVE' }
          })
        );
      });

      it('allows sign in when the account update fails', async () => {
        prismaMock.account.update.mockRejectedValue(new Error('not found'));

        expect(
          await signIn({ account: oauthAccount(), profile: { id: 'p' } })
        ).toBe(true);
      });
    });

    it('rejects when the account lookup fails', async () => {
      prismaMock.account.findUnique.mockRejectedValue(new Error('db down'));

      await expect(
        signIn({ account: oauthAccount(), profile: { id: 'p' } })
      ).rejects.toThrow('db down');
    });
  });
});
