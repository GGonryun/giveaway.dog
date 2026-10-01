import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IdentityProvider } from '@prisma/client';
import updateProfileDefault, { updateProfile } from '../update-profile';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import { dbUser } from './fixtures-procedures-user';

type UpdateProfileInput = Parameters<typeof updateProfile>[0];

describe('updateProfile', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports the same procedure as the default export', () => {
    expect(updateProfileDefault).toBe(updateProfile);
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await updateProfile({ name: 'Jane Doe' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects a name shorter than 5 characters', async () => {
      const result = await updateProfile({ name: 'Jane' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Username must be at least 5 characters'
      );
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('rejects an empty name', async () => {
      const result = await updateProfile({ name: '' });

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('rejects a name with disallowed characters', async () => {
      const result = await updateProfile({ name: 'Jane!Doe' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Username can only contain letters, numbers, spaces, hyphens, and underscores'
      );
    });

    it('rejects an image that is not a url', async () => {
      const result = await updateProfile({ image: 'avatar.png' });

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('rejects an unknown preferred contact method', async () => {
      const result = await updateProfile({
        preferredContactMethod: 'PIGEON'
      } as unknown as UpdateProfileInput);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });

  describe('when the input is valid', () => {
    beforeEach(() => {
      signIn();
      prismaMock.user.update.mockResolvedValue(dbUser());
    });

    it('updates only the name when only a name is given', async () => {
      await updateProfile({ name: 'Jane_Doe-2 x' });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        data: { name: 'Jane_Doe-2 x' }
      });
    });

    it('updates every provided field', async () => {
      await updateProfile({
        name: 'Jane Doe',
        image: 'https://example.com/me.png',
        preferredContactMethod: IdentityProvider.DISCORD
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        data: {
          name: 'Jane Doe',
          image: 'https://example.com/me.png',
          preferredContactMethod: IdentityProvider.DISCORD
        }
      });
    });

    it('clears the image and contact method when they are null', async () => {
      await updateProfile({ image: null, preferredContactMethod: null });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        data: { image: null, preferredContactMethod: null }
      });
    });

    it('still issues an update with empty data when nothing is provided', async () => {
      await updateProfile({});

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        data: {}
      });
    });

    it('returns the full updated user record rather than only the id', async () => {
      const updated = dbUser({ name: 'Jane Doe' });
      prismaMock.user.update.mockResolvedValue(updated);

      const result = await updateProfile({ name: 'Jane Doe' });

      expect(expectOk(result)).toEqual(updated);
    });
  });

  describe('when the update fails', () => {
    it('returns INTERNAL_SERVER_ERROR with a generic message', async () => {
      signIn();
      prismaMock.user.update.mockRejectedValue(knownRequestError('P2025'));

      const result = await updateProfile({ name: 'Jane Doe' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to update profile'
      );
    });

    it('fails output validation when the updated record has no id', async () => {
      signIn();
      prismaMock.user.update.mockResolvedValue({ name: 'Jane Doe' });

      const result = await updateProfile({ name: 'Jane Doe' });

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });
});
