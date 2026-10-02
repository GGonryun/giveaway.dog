import { describe, it, expect } from 'vitest';
import { UserAccountType } from '@prisma/client';
import {
  accountTypeSchema,
  completeOnboardingSchema,
  updateAccountTypeSchema,
  ACCOUNT_TYPE_OPTIONS
} from '../onboarding';

const validInput = { username: 'jane_99', accountType: 'HOST' };

const messagesFor = (input: Record<string, unknown>) => {
  const result = completeOnboardingSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
};

describe('accountTypeSchema', () => {
  it.each(Object.values(UserAccountType))('accepts %s', (type) => {
    expect(accountTypeSchema.parse(type)).toBe(type);
  });

  it('rejects lowercase account types', () => {
    expect(accountTypeSchema.safeParse('host').success).toBe(false);
  });
});

describe('completeOnboardingSchema', () => {
  describe('when the input is valid', () => {
    it('accepts a username and account type without an image', () => {
      expect(completeOnboardingSchema.parse(validInput)).toEqual(validInput);
    });

    it('accepts a null image', () => {
      expect(
        completeOnboardingSchema.parse({ ...validInput, image: null })
      ).toEqual({ ...validInput, image: null });
    });

    it('accepts an image URL', () => {
      expect(
        completeOnboardingSchema.parse({
          ...validInput,
          image: 'https://example.com/a.png'
        }).image
      ).toBe('https://example.com/a.png');
    });

    it('accepts a three character username', () => {
      expect(messagesFor({ ...validInput, username: 'abc' })).toEqual([]);
    });

    it('accepts a fifteen character username', () => {
      expect(messagesFor({ ...validInput, username: 'a'.repeat(15) })).toEqual(
        []
      );
    });
  });

  describe('username rules', () => {
    it('rejects a two character username', () => {
      expect(messagesFor({ ...validInput, username: 'ab' })).toEqual([
        'Username must be at least 3 characters'
      ]);
    });

    it('rejects a sixteen character username', () => {
      expect(messagesFor({ ...validInput, username: 'a'.repeat(16) })).toEqual([
        'Username must be at most 15 characters'
      ]);
    });

    it.each(['jane doe', 'jane-doe', 'jané', 'jane.doe'])(
      'rejects the username %j',
      (username) => {
        expect(messagesFor({ ...validInput, username })).toEqual([
          'Username can only contain letters, numbers, and underscores'
        ]);
      }
    );

    it('reports both the length and character errors together', () => {
      expect(messagesFor({ ...validInput, username: '!' })).toEqual([
        'Username must be at least 3 characters',
        'Username can only contain letters, numbers, and underscores'
      ]);
    });
  });

  describe('other fields', () => {
    it('rejects an unknown account type', () => {
      const result = completeOnboardingSchema.safeParse({
        ...validInput,
        accountType: 'ADMIN'
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['accountType']);
    });

    it('rejects an image that is not a URL', () => {
      const result = completeOnboardingSchema.safeParse({
        ...validInput,
        image: 'avatar.png'
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['image']);
    });
  });
});

describe('updateAccountTypeSchema', () => {
  it('accepts a valid account type', () => {
    expect(
      updateAccountTypeSchema.parse({ accountType: 'PARTICIPANT' })
    ).toEqual({ accountType: 'PARTICIPANT' });
  });

  it('rejects a missing account type', () => {
    expect(updateAccountTypeSchema.safeParse({}).success).toBe(false);
  });
});

describe('ACCOUNT_TYPE_OPTIONS', () => {
  it('describes both account types', () => {
    expect(ACCOUNT_TYPE_OPTIONS).toEqual({
      PARTICIPANT: {
        title: 'Participate in Giveaways',
        description:
          'Browse and enter giveaways from your favorite creators and brands.',
        emoji: '🎉'
      },
      HOST: {
        title: 'Host Giveaways',
        description:
          'Create and manage giveaways for your community, brand, or organization.',
        emoji: '🎁'
      }
    });
  });

  it('has an option for every account type', () => {
    expect(Object.keys(ACCOUNT_TYPE_OPTIONS).sort()).toEqual(
      Object.values(UserAccountType).sort()
    );
  });
});
