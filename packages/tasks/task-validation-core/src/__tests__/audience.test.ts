import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateAudience } from '../audience';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { db } from '@giveaway/testing-server/fixtures-task-validation';
import { buildSelectedUser } from '@giveaway/testing-server/fixtures-procedures-browse-marketing-pickers';
import { USER_SCHEMA_SELECT_QUERY } from '@giveaway/user-model/user';
import { applicationError } from '@giveaway/util-errors/testing/application-error';

const NOW = new Date('2026-03-10T12:00:00.000Z');
const ARGS = { sweepstakesId: 'sw-1', userId: 'user-1' };

const refusal = (code: string, message: string) => ({ code, message });

const expectRefusal = async (expected: ReturnType<typeof refusal>) => {
  const error = await applicationError(validateAudience(db, ARGS));
  expect({ code: error.code, message: error.message }).toEqual(expected);
};

const NOT_FOUND = refusal(
  'NOT_FOUND',
  'Giveaway not found. Refresh the page and try again, or contact support if the error persists.'
);

type Restriction = {
  regions: string[];
  filter: 'INCLUDE' | 'EXCLUDE' | null;
};

const formField = (overrides: Record<string, unknown> = {}) => ({
  id: 'field-age',
  audienceId: 'audience-1',
  label: 'I am at least 18',
  type: 'AGE',
  required: true,
  placeholder: null,
  minimum: 18,
  maximum: null,
  index: 0,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides
});

const givenSweepstakes = ({
  visibility = 'PUBLIC',
  teamId = 'team-1',
  allowedIdentities = ['ANONYMOUS'],
  formFields = [],
  regionalRestriction = null
}: {
  visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' | null;
  teamId?: string | null;
  allowedIdentities?: string[];
  formFields?: ReturnType<typeof formField>[];
  regionalRestriction?: Restriction | null;
} = {}) =>
  prismaMock.sweepstakes.findUnique.mockResolvedValue({
    teamId,
    visibility: visibility ? { visibility } : null,
    audience: { allowedIdentities, formFields, regionalRestriction }
  });

const givenUser = ({
  countryCode = 'US',
  providers = [],
  birthday = null
}: {
  countryCode?: string | null;
  providers?: string[];
  birthday?: Date | null;
} = {}) =>
  prismaMock.user.findUnique.mockResolvedValue({
    ...buildSelectedUser({ id: 'user-1', birthday }),
    ips: countryCode ? [{ ip: { countryCode } }] : [],
    accounts: providers.map((provider) => ({
      provider,
      scope: null,
      label: provider,
      link: null,
      status: 'ACTIVE'
    }))
  });

const givenFormValues = (values: Record<string, string> | null) =>
  prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
    values
      ? {
          formValues: Object.entries(values).map(([fieldId, value]) => ({
            id: `value-${fieldId}`,
            participantId: 'participant-1',
            fieldId,
            value
          }))
        }
      : null
  );

describe('validateAudience', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    givenSweepstakes();
    givenUser();
    givenFormValues(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('loading', () => {
    it('loads the audience, the user and the form values of the participant', async () => {
      await validateAudience(db, ARGS);

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: 'sw-1' },
        select: {
          teamId: true,
          visibility: { select: { visibility: true } },
          audience: {
            include: { formFields: true, regionalRestriction: true }
          }
        }
      });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: USER_SCHEMA_SELECT_QUERY
      });
      expect(prismaMock.sweepstakesParticipant.findUnique).toHaveBeenCalledWith(
        {
          where: {
            userId_sweepstakesId: { userId: 'user-1', sweepstakesId: 'sw-1' }
          },
          select: { formValues: true }
        }
      );
    });

    it('refuses a giveaway that does not exist', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await expectRefusal(NOT_FOUND);
    });

    it('applies the default audience to a giveaway without one', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        teamId: 'team-1',
        visibility: { visibility: 'PUBLIC' },
        audience: null
      });
      givenUser({ providers: ['google'] });

      await expect(validateAudience(db, ARGS)).resolves.toBeUndefined();
    });

    it('refuses an anonymous user of a giveaway without an audience', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        teamId: 'team-1',
        visibility: { visibility: 'PUBLIC' },
        audience: null
      });

      await expectRefusal(
        refusal(
          'FORBIDDEN',
          'Connect one of the accounts that this giveaway accepts to enter it.'
        )
      );
    });

    it('refuses a user that does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expectRefusal(NOT_FOUND);
    });

    it('accepts a user that the audience allows', async () => {
      await expect(validateAudience(db, ARGS)).resolves.toBeUndefined();
    });
  });

  describe('private giveaways', () => {
    it('refuses a user who is not a member of the team', async () => {
      givenSweepstakes({ visibility: 'PRIVATE' });
      prismaMock.membership.findUnique.mockResolvedValue(null);

      await expectRefusal(NOT_FOUND);
      expect(prismaMock.membership.findUnique).toHaveBeenCalledWith({
        where: { userId_teamId: { userId: 'user-1', teamId: 'team-1' } },
        select: { id: true }
      });
    });

    it('refuses a private giveaway without a team', async () => {
      givenSweepstakes({ visibility: 'PRIVATE', teamId: null });

      await expectRefusal(NOT_FOUND);
      expect(prismaMock.membership.findUnique).not.toHaveBeenCalled();
    });

    it('accepts a member of the team', async () => {
      givenSweepstakes({ visibility: 'PRIVATE' });
      prismaMock.membership.findUnique.mockResolvedValue({ id: 'm-1' });

      await expect(validateAudience(db, ARGS)).resolves.toBeUndefined();
    });

    it.each(['PUBLIC', 'UNLISTED', null] as const)(
      'does not check the membership for a %s giveaway',
      async (visibility) => {
        givenSweepstakes({ visibility });

        await validateAudience(db, ARGS);

        expect(prismaMock.membership.findUnique).not.toHaveBeenCalled();
      }
    );
  });

  describe('allowed identities', () => {
    const NOT_CONNECTED = refusal(
      'FORBIDDEN',
      'Connect one of the accounts that this giveaway accepts to enter it.'
    );

    it('refuses a user without an allowed account', async () => {
      givenSweepstakes({ allowedIdentities: ['DISCORD'] });
      givenUser({ providers: ['google'] });

      await expectRefusal(NOT_CONNECTED);
    });

    it('accepts a user with an allowed account', async () => {
      givenSweepstakes({ allowedIdentities: ['DISCORD'] });
      givenUser({ providers: ['google', 'discord'] });

      await expect(validateAudience(db, ARGS)).resolves.toBeUndefined();
    });
  });

  describe('form fields', () => {
    const INCOMPLETE = refusal(
      'FORBIDDEN',
      'Complete your profile to enter this giveaway.'
    );

    it('refuses a user who has not confirmed a required age', async () => {
      givenSweepstakes({ formFields: [formField()] });

      await expectRefusal(INCOMPLETE);
    });

    it('refuses a participant whose stored values miss a required field', async () => {
      givenSweepstakes({
        formFields: [
          formField(),
          formField({
            id: 'field-twitter',
            type: 'TWITTER',
            label: 'X profile',
            required: true,
            minimum: null
          })
        ]
      });
      givenUser({ birthday: new Date('2000-01-01T00:00:00.000Z') });
      givenFormValues({ 'field-other': 'value' });

      await expectRefusal(INCOMPLETE);
    });

    it('accepts a participant whose stored values miss only an optional field', async () => {
      givenSweepstakes({
        formFields: [
          formField(),
          formField({
            id: 'field-twitter',
            type: 'TWITTER',
            label: 'X profile',
            required: false,
            minimum: null
          })
        ]
      });
      givenUser({ birthday: new Date('2000-01-01T00:00:00.000Z') });
      givenFormValues({ 'field-twitter': '' });

      await expect(validateAudience(db, ARGS)).resolves.toBeUndefined();
    });

    it('accepts a user whose profile has the required age', async () => {
      givenSweepstakes({ formFields: [formField()] });
      givenUser({ birthday: new Date('2000-01-01T00:00:00.000Z') });

      await expect(validateAudience(db, ARGS)).resolves.toBeUndefined();
    });

    it('accepts a participant who confirmed the age in the form', async () => {
      givenSweepstakes({ formFields: [formField()] });
      givenFormValues({ 'field-age': 'true' });

      await expect(validateAudience(db, ARGS)).resolves.toBeUndefined();
    });

    it('refuses a participant whose stored values do not fill the form', async () => {
      givenSweepstakes({ formFields: [formField()] });
      givenFormValues({});

      await expectRefusal(INCOMPLETE);
    });
  });

  describe('regional restriction', () => {
    const NOT_ELIGIBLE = refusal(
      'FORBIDDEN',
      'You are not eligible to participate in this giveaway.'
    );

    it('refuses a user outside an included region', async () => {
      givenSweepstakes({
        regionalRestriction: { regions: ['country:US'], filter: 'INCLUDE' }
      });
      givenUser({ countryCode: null });

      await expectRefusal(NOT_ELIGIBLE);
    });

    it('accepts a user inside an included region', async () => {
      givenSweepstakes({
        regionalRestriction: { regions: ['country:US'], filter: 'INCLUDE' }
      });

      await expect(validateAudience(db, ARGS)).resolves.toBeUndefined();
    });

    it('refuses a user inside an excluded region', async () => {
      givenSweepstakes({
        regionalRestriction: { regions: ['country:US'], filter: 'EXCLUDE' }
      });

      await expectRefusal(NOT_ELIGIBLE);
    });

    it('includes the regions of a restriction without a filter', async () => {
      givenSweepstakes({
        regionalRestriction: { regions: ['country:CA'], filter: null }
      });

      await expectRefusal(NOT_ELIGIBLE);
    });
  });
});
