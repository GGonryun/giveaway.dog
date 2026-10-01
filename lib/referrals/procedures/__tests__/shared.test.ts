import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { User } from '@prisma/client';
import { ApplicationError } from '@/lib/errors';
import { asPrismaClient, prismaMock } from '@/test/prisma';
import {
  generateReferral,
  getOrCreateReferral,
  REFERRAL_USER_INCLUDE,
  REFERRED_USER_INCLUDE,
  toReferralLink,
  toReferredUsers,
  toUserReferral
} from '../shared';

const mocks = vi.hoisted(() => ({ nanoid: vi.fn() }));

vi.mock('nanoid', () => ({ nanoid: mocks.nanoid }));

const USER_CREATED_AT = new Date('2025-12-01T00:00:00.000Z');
const REFERRED_AT = new Date('2026-03-01T00:00:00.000Z');

const userRow = (overrides: Partial<User> = {}): User => ({
  id: 'u-1',
  name: 'Jane',
  email: null,
  emailVerified: null,
  username: null,
  birthday: null,
  image: null,
  emoji: null,
  onboarded: true,
  accountType: 'PARTICIPANT',
  createdAt: USER_CREATED_AT,
  updatedAt: USER_CREATED_AT,
  source: 'SIGNUP',
  preferredContactMethod: null,
  ...overrides
});

const referredUserRow = (user: User) => ({
  id: `ru-${user.id}`,
  referralId: 'ref-1',
  userId: user.id,
  createdAt: REFERRED_AT,
  user
});

const referralRow = (referredUsers = [referredUserRow(userRow())]) => ({
  id: 'ref-1',
  code: 'abc123',
  participantId: 'participant-1',
  taskId: 'task-1',
  createdAt: REFERRED_AT,
  updatedAt: REFERRED_AT,
  referredUsers
});

describe('referral include queries', () => {
  it('includes the user of each referred user', () => {
    expect(REFERRED_USER_INCLUDE).toEqual({ user: true });
  });

  it('includes referred users with their user', () => {
    expect(REFERRAL_USER_INCLUDE).toEqual({
      referredUsers: { include: { user: true } }
    });
  });
});

describe('generateReferral', () => {
  beforeEach(() => {
    mocks.nanoid.mockReset();
    let counter = 0;
    mocks.nanoid.mockImplementation(() => `code-${++counter}`);
  });

  it('returns the first code when it is not taken', async () => {
    prismaMock.referral.findUnique.mockResolvedValue(null);

    const code = await generateReferral(asPrismaClient());

    expect(code).toBe('code-1');
    expect(mocks.nanoid).toHaveBeenCalledWith(6);
    expect(prismaMock.referral.findUnique).toHaveBeenCalledWith({
      where: { code: 'code-1' }
    });
  });

  it('retries with a new code when the previous one is taken', async () => {
    prismaMock.referral.findUnique
      .mockResolvedValueOnce({ id: 'existing' })
      .mockResolvedValueOnce({ id: 'existing' })
      .mockResolvedValueOnce(null);

    const code = await generateReferral(asPrismaClient());

    expect(code).toBe('code-3');
    expect(prismaMock.referral.findUnique).toHaveBeenCalledTimes(3);
  });

  it('accepts a unique code found on the tenth check', async () => {
    for (let i = 0; i < 9; i++) {
      prismaMock.referral.findUnique.mockResolvedValueOnce({ id: 'taken' });
    }
    prismaMock.referral.findUnique.mockResolvedValueOnce(null);

    const code = await generateReferral(asPrismaClient());

    expect(code).toBe('code-10');
  });

  it('throws INTERNAL_SERVER_ERROR after ten taken codes', async () => {
    prismaMock.referral.findUnique.mockResolvedValue({ id: 'taken' });

    const promise = generateReferral(asPrismaClient());

    await expect(promise).rejects.toBeInstanceOf(ApplicationError);
    await expect(promise).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to generate unique referral code'
    });
    expect(prismaMock.referral.findUnique).toHaveBeenCalledTimes(10);
    expect(mocks.nanoid).toHaveBeenCalledTimes(11);
  });
});

describe('getOrCreateReferral', () => {
  beforeEach(() => {
    mocks.nanoid.mockReset();
    mocks.nanoid.mockReturnValue('newcod');
  });

  it('looks up the referral for the participant and task', async () => {
    prismaMock.referral.findUnique.mockResolvedValue(referralRow());

    await getOrCreateReferral(asPrismaClient(), 'participant-1', 'task-1');

    expect(prismaMock.referral.findUnique).toHaveBeenCalledWith({
      where: {
        participantId_taskId: {
          participantId: 'participant-1',
          taskId: 'task-1'
        }
      },
      include: REFERRAL_USER_INCLUDE
    });
  });

  it('returns an existing referral without creating one', async () => {
    const existing = referralRow();
    prismaMock.referral.findUnique.mockResolvedValue(existing);

    const referral = await getOrCreateReferral(
      asPrismaClient(),
      'participant-1',
      'task-1'
    );

    expect(referral).toBe(existing);
    expect(prismaMock.referral.create).not.toHaveBeenCalled();
    expect(mocks.nanoid).not.toHaveBeenCalled();
  });

  it('creates a referral with a fresh unique code when none exists', async () => {
    const created = referralRow([]);
    prismaMock.referral.findUnique.mockResolvedValue(null);
    prismaMock.referral.create.mockResolvedValue(created);

    const referral = await getOrCreateReferral(
      asPrismaClient(),
      'participant-1',
      'task-1'
    );

    expect(referral).toBe(created);
    expect(prismaMock.referral.findUnique).toHaveBeenLastCalledWith({
      where: { code: 'newcod' }
    });
    expect(prismaMock.referral.create).toHaveBeenCalledWith({
      data: {
        code: 'newcod',
        participantId: 'participant-1',
        taskId: 'task-1'
      },
      include: REFERRAL_USER_INCLUDE
    });
  });

  it('propagates the code generation failure without creating', async () => {
    prismaMock.referral.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 'taken' });

    await expect(
      getOrCreateReferral(asPrismaClient(), 'participant-1', 'task-1')
    ).rejects.toThrow('Failed to generate unique referral code');
    expect(prismaMock.referral.create).not.toHaveBeenCalled();
  });
});

describe('toReferralLink', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds a browse link with the referral code', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.dog');

    expect(toReferralLink({ sweepstakesId: 'sweep-1', code: 'abc123' })).toBe(
      'https://giveaway.dog/browse/sweep-1?ref=abc123'
    );
  });

  it('interpolates undefined when the app url is not configured', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);

    expect(toReferralLink({ sweepstakesId: 'sweep-1', code: 'abc123' })).toBe(
      'undefined/browse/sweep-1?ref=abc123'
    );
  });
});

describe('toReferredUsers', () => {
  it('maps each referred user to its id, name and account creation date', () => {
    expect(toReferredUsers([referredUserRow(userRow())])).toEqual([
      { user: { id: 'u-1', name: 'Jane' }, createdAt: USER_CREATED_AT }
    ]);
  });

  it('falls back to the username when the name is missing', () => {
    const [referred] = toReferredUsers([
      referredUserRow(userRow({ name: null, username: 'jane_d' }))
    ]);

    expect(referred.user.name).toBe('jane_d');
  });

  it('falls back to Anonymous when name and username are missing', () => {
    const [referred] = toReferredUsers([
      referredUserRow(userRow({ name: null, username: null }))
    ]);

    expect(referred.user.name).toBe('Anonymous');
  });

  it('keeps an empty name instead of falling back', () => {
    const [referred] = toReferredUsers([
      referredUserRow(userRow({ name: '', username: 'jane_d' }))
    ]);

    expect(referred.user.name).toBe('');
  });

  it('returns an empty list for no referred users', () => {
    expect(toReferredUsers([])).toEqual([]);
  });
});

describe('toUserReferral', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the code as id and builds the link and referrals', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.dog');

    const referral = toUserReferral({
      ...referralRow([
        referredUserRow(userRow()),
        referredUserRow(userRow({ id: 'u-2', name: 'Bob' }))
      ]),
      sweepstakesId: 'sweep-1'
    });

    expect(referral).toEqual({
      id: 'abc123',
      code: 'abc123',
      link: 'https://giveaway.dog/browse/sweep-1?ref=abc123',
      referrals: [
        { user: { id: 'u-1', name: 'Jane' }, createdAt: USER_CREATED_AT },
        { user: { id: 'u-2', name: 'Bob' }, createdAt: USER_CREATED_AT }
      ]
    });
  });
});
