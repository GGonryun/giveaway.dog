import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toSweepstakesState } from '../sweepstakes';
import { ApplicationError } from '@giveaway/util-errors';

type Args = Parameters<typeof toSweepstakesState>[0];
type Participant = NonNullable<Args['participant']>;

const NOW = new Date('2026-06-15T12:00:00.000Z');
const PAST = new Date('2026-06-01T00:00:00.000Z');
const FUTURE = new Date('2026-07-01T00:00:00.000Z');

const usernameField = {
  id: 'field-username',
  type: 'USERNAME',
  label: 'Username',
  placeholder: null,
  required: true
};

const build = ({
  status = 'RUNNING',
  startDate = PAST,
  endDate = FUTURE,
  regionalRestriction = null,
  formFields = [],
  participant
}: {
  status?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  regionalRestriction?: { regions: string[]; filter: string } | null;
  formFields?: unknown[];
  participant?: Participant;
} = {}): Args =>
  ({
    sweepstakes: {
      id: 'sw-1',
      status,
      timing: { startDate, endDate, timeZone: 'UTC' },
      audience: {
        allowedIdentities: ['EMAIL'],
        regionalRestriction,
        requirePreEntryLogin: false,
        formFields
      }
    },
    prizes: [],
    participant
  }) as unknown as Args;

const participant = ({
  countryCode = 'US',
  name = 'Jane',
  formValues = {}
}: {
  countryCode?: string | null;
  name?: string | null;
  formValues?: Record<string, unknown>;
} = {}): Participant =>
  ({
    id: 'participant-1',
    user: {
      id: 'user-1',
      name,
      email: 'jane@example.com',
      countryCode,
      providers: []
    },
    completions: [],
    allocation: null,
    formValues
  }) as unknown as Participant;

const catchError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected function to throw');
};

describe('toSweepstakesState', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the sweepstakes is not running', () => {
    it('returns closed for drafts', () => {
      expect(toSweepstakesState(build({ status: 'DRAFT' }))).toBe('closed');
    });

    it('returns winners-announced for completed sweepstakes', () => {
      expect(toSweepstakesState(build({ status: 'COMPLETED' }))).toBe(
        'winners-announced'
      );
    });

    it('returns winners-pending for expired sweepstakes', () => {
      expect(toSweepstakesState(build({ status: 'EXPIRED' }))).toBe(
        'winners-pending'
      );
    });

    it('returns error for sweepstakes in an error state', () => {
      expect(toSweepstakesState(build({ status: 'ERROR' }))).toBe('error');
    });

    it('ignores the participant for terminal states', () => {
      expect(
        toSweepstakesState(
          build({ status: 'COMPLETED', participant: participant() })
        )
      ).toBe('winners-announced');
    });

    it('throws for an unknown status', () => {
      expect(() => toSweepstakesState(build({ status: 'PAUSED' }))).toThrow(
        'Unexpected value: PAUSED'
      );
    });
  });

  describe('when the sweepstakes is scheduled', () => {
    it('returns pending when the start date is in the future', () => {
      expect(
        toSweepstakesState(build({ status: 'SCHEDULED', startDate: FUTURE }))
      ).toBe('pending');
    });

    it('returns active when the start date has passed', () => {
      expect(
        toSweepstakesState(build({ status: 'SCHEDULED', startDate: PAST }))
      ).toBe('active');
    });

    it('returns active when the start date is exactly now', () => {
      expect(
        toSweepstakesState(build({ status: 'SCHEDULED', startDate: NOW }))
      ).toBe('active');
    });

    it('accepts an ISO string start date', () => {
      expect(
        toSweepstakesState(
          build({ status: 'SCHEDULED', startDate: FUTURE.toISOString() })
        )
      ).toBe('pending');
    });

    it('returns active without a participant once started, even after the end date', () => {
      expect(
        toSweepstakesState(
          build({ status: 'SCHEDULED', startDate: PAST, endDate: PAST })
        )
      ).toBe('active');
    });
  });

  describe('when the sweepstakes is running', () => {
    it('returns not-logged-in without a participant', () => {
      expect(toSweepstakesState(build())).toBe('not-logged-in');
    });

    it('returns active for an eligible participant before the end date', () => {
      expect(toSweepstakesState(build({ participant: participant() }))).toBe(
        'active'
      );
    });

    it('returns active when the end date is exactly now', () => {
      expect(
        toSweepstakesState(build({ endDate: NOW, participant: participant() }))
      ).toBe('active');
    });

    it('returns winners-pending when the end date has passed', () => {
      expect(
        toSweepstakesState(build({ endDate: PAST, participant: participant() }))
      ).toBe('winners-pending');
    });

    describe('profile completeness', () => {
      it('returns profile-incomplete when form fields exist and no values were submitted', () => {
        expect(
          toSweepstakesState(
            build({
              formFields: [usernameField],
              participant: participant({ formValues: {} })
            })
          )
        ).toBe('profile-incomplete');
      });

      it('returns profile-incomplete when a field has no value', () => {
        expect(
          toSweepstakesState(
            build({
              formFields: [usernameField],
              participant: participant({
                name: null,
                formValues: { other: 'x' }
              })
            })
          )
        ).toBe('profile-incomplete');
      });

      it('returns active when every form field is filled', () => {
        expect(
          toSweepstakesState(
            build({
              formFields: [usernameField],
              participant: participant({
                formValues: { 'field-username': 'jane' }
              })
            })
          )
        ).toBe('active');
      });

      it('checks the profile before eligibility', () => {
        expect(
          toSweepstakesState(
            build({
              formFields: [usernameField],
              regionalRestriction: {
                regions: ['country:CA'],
                filter: 'INCLUDE'
              },
              participant: participant({ formValues: {} })
            })
          )
        ).toBe('profile-incomplete');
      });
    });

    describe('regional restrictions', () => {
      it('returns not-eligible when the participant has no country code', () => {
        expect(
          toSweepstakesState(
            build({
              regionalRestriction: {
                regions: ['country:US'],
                filter: 'INCLUDE'
              },
              participant: participant({ countryCode: null })
            })
          )
        ).toBe('not-eligible');
      });

      it('returns not-eligible without a country code even for exclusion lists', () => {
        expect(
          toSweepstakesState(
            build({
              regionalRestriction: {
                regions: ['country:CA'],
                filter: 'EXCLUDE'
              },
              participant: participant({ countryCode: null })
            })
          )
        ).toBe('not-eligible');
      });

      it('returns active when an included country matches', () => {
        expect(
          toSweepstakesState(
            build({
              regionalRestriction: {
                regions: ['country:CA', 'country:US'],
                filter: 'INCLUDE'
              },
              participant: participant({ countryCode: 'US' })
            })
          )
        ).toBe('active');
      });

      it('returns active when the country belongs to an included continent', () => {
        expect(
          toSweepstakesState(
            build({
              regionalRestriction: {
                regions: ['continent:EU'],
                filter: 'INCLUDE'
              },
              participant: participant({ countryCode: 'FR' })
            })
          )
        ).toBe('active');
      });

      it('returns not-eligible when the country is not included', () => {
        expect(
          toSweepstakesState(
            build({
              regionalRestriction: {
                regions: ['continent:EU'],
                filter: 'INCLUDE'
              },
              participant: participant({ countryCode: 'US' })
            })
          )
        ).toBe('not-eligible');
      });

      it('returns not-eligible when the country is excluded', () => {
        expect(
          toSweepstakesState(
            build({
              regionalRestriction: {
                regions: ['country:US'],
                filter: 'EXCLUDE'
              },
              participant: participant({ countryCode: 'US' })
            })
          )
        ).toBe('not-eligible');
      });

      it('returns active when the country is not excluded', () => {
        expect(
          toSweepstakesState(
            build({
              regionalRestriction: {
                regions: ['country:US'],
                filter: 'EXCLUDE'
              },
              participant: participant({ countryCode: 'CA' })
            })
          )
        ).toBe('active');
      });

      it('checks eligibility before the end date', () => {
        expect(
          toSweepstakesState(
            build({
              endDate: PAST,
              regionalRestriction: {
                regions: ['country:US'],
                filter: 'EXCLUDE'
              },
              participant: participant({ countryCode: 'US' })
            })
          )
        ).toBe('not-eligible');
      });

      it('throws a BAD_REQUEST error for an invalid region', () => {
        const error = catchError(() =>
          toSweepstakesState(
            build({
              regionalRestriction: { regions: ['US'], filter: 'INCLUDE' },
              participant: participant()
            })
          )
        );

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'BAD_REQUEST',
          message: 'Invalid region: US'
        });
      });

      it('throws for an unknown filter', () => {
        expect(() =>
          toSweepstakesState(
            build({
              regionalRestriction: { regions: ['country:US'], filter: 'ONLY' },
              participant: participant()
            })
          )
        ).toThrow('Unexpected value: ONLY');
      });
    });
  });
});
