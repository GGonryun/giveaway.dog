import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserAccountType } from '@prisma/client';
import completeOnboarding from '../complete-onboarding';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import { dbUser, PRISMA_NOT_FOUND_MESSAGE } from './fixtures-procedures-user';

type OnboardingInput = Parameters<typeof completeOnboarding>[0];

const validInput = (
  overrides: Partial<OnboardingInput> = {}
): OnboardingInput => ({
  username: 'jane_doe',
  accountType: UserAccountType.HOST,
  ...overrides
});

describe('completeOnboarding', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await completeOnboarding(validInput());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects a username shorter than 3 characters', async () => {
      const result = await completeOnboarding(validInput({ username: 'ab' }));

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Username must be at least 3 characters'
      );
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('accepts a username of exactly 3 characters', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.update.mockResolvedValue(
        dbUser({ username: 'abc', accountType: UserAccountType.HOST })
      );

      const result = await completeOnboarding(validInput({ username: 'abc' }));

      expectOk(result);
    });

    it('accepts a username of exactly 15 characters', async () => {
      const username = 'a'.repeat(15);
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.update.mockResolvedValue(
        dbUser({ username, accountType: UserAccountType.HOST })
      );

      const result = await completeOnboarding(validInput({ username }));

      expectOk(result);
    });

    it('rejects a username longer than 15 characters', async () => {
      const result = await completeOnboarding(
        validInput({ username: 'a'.repeat(16) })
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Username must be at most 15 characters'
      );
    });

    it('rejects a username with characters other than letters, numbers and underscores', async () => {
      const result = await completeOnboarding(
        validInput({ username: 'jane-doe' })
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Username can only contain letters, numbers, and underscores'
      );
    });

    it('rejects an unknown account type', async () => {
      const result = await completeOnboarding(
        validInput({
          accountType: 'ADMIN' as unknown as OnboardingInput['accountType']
        })
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
    });

    it('rejects an image that is not a url', async () => {
      const result = await completeOnboarding(
        validInput({ image: 'not-a-url' })
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  describe('when the username is taken by another user', () => {
    it('returns CONFLICT without updating the user', async () => {
      signIn();
      prismaMock.user.findFirst.mockResolvedValue(
        dbUser({ id: 'someone-else', username: 'jane_doe' })
      );

      const result = await completeOnboarding(validInput());

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'Username is already taken'
      );
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  describe('when the username is available', () => {
    beforeEach(() => {
      signIn();
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.update.mockResolvedValue(
        dbUser({
          username: 'jane_doe',
          accountType: UserAccountType.HOST,
          onboarded: true
        })
      );
    });

    it('checks for an existing user with the requested username', async () => {
      await completeOnboarding(validInput());

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { username: 'jane_doe' }
      });
    });

    it('marks the session user as onboarded with the chosen username and account type', async () => {
      await completeOnboarding(validInput());

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        data: {
          username: 'jane_doe',
          accountType: UserAccountType.HOST,
          onboarded: true
        }
      });
    });

    it('leaves the image out of the update when none is provided', async () => {
      await completeOnboarding(validInput());

      expect(prismaMock.user.update.mock.calls[0][0].data).not.toHaveProperty(
        'image'
      );
    });

    it('writes the image when one is provided', async () => {
      await completeOnboarding(
        validInput({ image: 'https://example.com/me.png' })
      );

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ image: 'https://example.com/me.png' })
        })
      );
    });

    it('clears the image when null is provided', async () => {
      await completeOnboarding(validInput({ image: null }));

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ image: null })
        })
      );
    });

    it('returns only the id, username and account type', async () => {
      const result = await completeOnboarding(validInput());

      expect(expectOk(result)).toEqual({
        id: 'user-1',
        username: 'jane_doe',
        accountType: UserAccountType.HOST
      });
    });

    it('returns the values stored on the updated row rather than the input', async () => {
      prismaMock.user.update.mockResolvedValue(
        dbUser({
          id: 'stored-id',
          username: 'stored_name',
          accountType: UserAccountType.PARTICIPANT
        })
      );

      const result = await completeOnboarding(validInput());

      expect(expectOk(result)).toEqual({
        id: 'stored-id',
        username: 'stored_name',
        accountType: UserAccountType.PARTICIPANT
      });
    });
  });

  describe('when the username already belongs to the caller', () => {
    it('updates the user', async () => {
      signIn();
      prismaMock.user.findFirst.mockResolvedValue(
        dbUser({ id: TEST_USER.id, username: 'jane_doe' })
      );
      prismaMock.user.update.mockResolvedValue(
        dbUser({ username: 'jane_doe', accountType: UserAccountType.HOST })
      );

      const result = await completeOnboarding(validInput());

      expectOk(result);
      expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the update fails', () => {
    beforeEach(() => {
      signIn();
      prismaMock.user.findFirst.mockResolvedValue(null);
    });

    it('returns INTERNAL_SERVER_ERROR with a generic message', async () => {
      prismaMock.user.update.mockRejectedValue(new Error('write failed'));

      const result = await completeOnboarding(validInput());

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to complete onboarding'
      );
    });

    it('wraps a P2025 error as INTERNAL_SERVER_ERROR instead of NOT_FOUND', async () => {
      prismaMock.user.update.mockRejectedValue(knownRequestError('P2025'));

      const result = await completeOnboarding(validInput());

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to complete onboarding'
      );
    });
  });

  describe('when the username lookup fails', () => {
    it('maps a P2025 error to NOT_FOUND', async () => {
      signIn();
      prismaMock.user.findFirst.mockRejectedValue(knownRequestError('P2025'));

      const result = await completeOnboarding(validInput());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        PRISMA_NOT_FOUND_MESSAGE
      );
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  describe('when the updated user has no username', () => {
    it('fails output validation', async () => {
      signIn();
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.update.mockResolvedValue(dbUser({ username: null }));

      const result = await completeOnboarding(validInput());

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed: /
      );
    });
  });
});
