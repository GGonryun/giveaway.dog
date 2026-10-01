import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserAccountType } from '@prisma/client';
import updateAccountType from '../update-account-type';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import { dbUser } from './fixtures-procedures-user';

type UpdateAccountTypeInput = Parameters<typeof updateAccountType>[0];

describe('updateAccountType', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated callers', async () => {
    const result = await updateAccountType({
      accountType: UserAccountType.HOST
    });

    expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
      'Invalid session'
    );
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('rejects an unknown account type', async () => {
    signIn();

    const result = await updateAccountType({
      accountType: 'BOTH'
    } as unknown as UpdateAccountTypeInput);

    expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
      /^Input validation failed: /
    );
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('marks the session user as onboarded with the new account type', async () => {
    signIn();
    prismaMock.user.update.mockResolvedValue(
      dbUser({ accountType: UserAccountType.HOST, onboarded: true })
    );

    await updateAccountType({ accountType: UserAccountType.HOST });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER.id },
      data: { onboarded: true, accountType: UserAccountType.HOST }
    });
  });

  it('returns the id and the stored account type', async () => {
    signIn();
    prismaMock.user.update.mockResolvedValue(
      dbUser({ accountType: UserAccountType.PARTICIPANT })
    );

    const result = await updateAccountType({
      accountType: UserAccountType.PARTICIPANT
    });

    expect(expectOk(result)).toEqual({
      id: 'user-1',
      accountType: UserAccountType.PARTICIPANT
    });
  });

  it('returns INTERNAL_SERVER_ERROR when the update fails', async () => {
    signIn();
    prismaMock.user.update.mockRejectedValue(knownRequestError('P2025'));

    const result = await updateAccountType({
      accountType: UserAccountType.HOST
    });

    expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
      'Failed to update account type'
    );
  });
});
