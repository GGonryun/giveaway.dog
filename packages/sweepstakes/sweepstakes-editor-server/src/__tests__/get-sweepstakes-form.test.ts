import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getSweepstakesForm from '../get-sweepstakes-form';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { FORM_SWEEPSTAKES_PAYLOAD } from '@giveaway/sweepstakes-model/db';
import { DEFAULT_ALLOWED_IDENTITIES } from '@giveaway/app-config/settings';
import {
  bonusTaskConfig,
  SWEEPSTAKES_ID,
  TEAM_ID
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';

const NOW = new Date(2026, 9, 1, 15, 30, 0);
const START = new Date('2026-11-01T00:00:00.000Z');
const END = new Date('2026-11-08T00:00:00.000Z');

const fullRecord = () => ({
  id: SWEEPSTAKES_ID,
  status: 'ACTIVE',
  teamId: TEAM_ID,
  details: {
    name: 'Summer Giveaway',
    description: 'Win things',
    banner: 'https://example.com/banner.png'
  },
  terms: {
    type: 'TEMPLATE',
    sponsorName: 'Acme',
    sponsorAddress: '1 Main St',
    winnerSelectionMethod: 'Random Drawing',
    notificationTimeframeDays: 5,
    claimDeadlineDays: 10,
    maxEntriesPerUser: 3,
    governingLawCountry: 'USA',
    privacyPolicyUrl: 'https://example.com/privacy',
    additionalTerms: 'None',
    text: 'Full terms'
  },
  audience: {
    allowedIdentities: ['TWITTER', 'GOOGLE'],
    requirePreEntryLogin: true,
    requireEmail: null,
    regionalRestriction: { filter: 'EXCLUDE', regions: ['FR'] },
    minimumAgeRestriction: null,
    formFields: [
      {
        id: 'field-1',
        label: 'Username',
        type: 'USERNAME',
        required: true,
        placeholder: '@you',
        minimum: null,
        maximum: null,
        index: 0
      }
    ]
  },
  timing: { startDate: START, endDate: END, timeZone: 'America/New_York' },
  prizes: [{ id: 'prize-1', name: 'Gold', quota: 1, index: 0 }],
  tasks: [{ id: 'task-1', index: 0, config: bonusTaskConfig() }],
  design: {
    data: {
      aspectRatio: 'NONE',
      displayName: false,
      displayDescription: false,
      background: {
        type: 'gradient',
        format: 'radial',
        stops: [{ color: '#ffffff', position: 10 }],
        angle: 45
      }
    }
  },
  visibility: { visibility: 'PUBLIC', slug: 'summer' },
  criteria: {
    minQualityScore: 60,
    minTasksCompleted: 2,
    allowMultipleWins: true,
    allowUserSelection: true,
    externalPlatforms: ['TWITTER_IMPORT']
  }
});

const emptyRecord = (overrides: Record<string, unknown> = {}) => ({
  id: SWEEPSTAKES_ID,
  status: 'DRAFT',
  teamId: TEAM_ID,
  details: null,
  terms: null,
  audience: null,
  timing: null,
  prizes: [],
  tasks: [],
  design: null,
  visibility: null,
  criteria: null,
  ...overrides
});

describe('getSweepstakesForm', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the caller is not authenticated', () => {
    it('returns UNAUTHORIZED without querying the database', async () => {
      const result = await getSweepstakesForm({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('rejects a missing id', async () => {
      signIn();

      const result = await getSweepstakesForm(
        {} as unknown as Parameters<typeof getSweepstakesForm>[0]
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes is not accessible', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);
    });

    it('looks up the sweepstakes through the caller team membership', async () => {
      await getSweepstakesForm({ id: SWEEPSTAKES_ID });

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: {
          id: SWEEPSTAKES_ID,
          team: { members: { some: { userId: TEST_USER.id } } }
        },
        include: FORM_SWEEPSTAKES_PAYLOAD
      });
    });

    it('returns NOT_FOUND naming the id', async () => {
      const result = await getSweepstakesForm({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        `Sweepstakes with ID ${SWEEPSTAKES_ID} not found`
      );
    });
  });

  describe('when the sweepstakes is fully configured', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(fullRecord());
    });

    it('returns the stored form values with id and status', async () => {
      const result = await getSweepstakesForm({ id: SWEEPSTAKES_ID });

      expect(expectOk(result)).toEqual({
        id: SWEEPSTAKES_ID,
        status: 'ACTIVE',
        setup: {
          name: 'Summer Giveaway',
          description: 'Win things',
          banner: 'https://example.com/banner.png'
        },
        terms: {
          type: 'TEMPLATE',
          sponsorName: 'Acme',
          sponsorAddress: '1 Main St',
          winnerSelectionMethod: 'Random Drawing',
          notificationTimeframeDays: 5,
          claimDeadlineDays: 10,
          maxEntriesPerUser: 3,
          governingLawCountry: 'USA',
          privacyPolicyUrl: 'https://example.com/privacy',
          additionalTerms: 'None',
          text: 'Full terms'
        },
        audience: {
          allowedIdentities: ['TWITTER', 'GOOGLE'],
          regionalRestriction: { regions: ['FR'], filter: 'EXCLUDE' },
          requirePreEntryLogin: true,
          formFields: [
            {
              id: 'field-1',
              label: 'Username',
              type: 'USERNAME',
              required: true,
              placeholder: '@you',
              index: 0
            }
          ]
        },
        timing: {
          startDate: START,
          endDate: END,
          timeZone: 'America/New_York'
        },
        prizes: [{ id: 'prize-1', name: 'Gold', quota: 1 }],
        tasks: [{ ...bonusTaskConfig(), id: 'task-1' }],
        design: {
          aspectRatio: 'NONE',
          displayName: false,
          displayDescription: false,
          background: {
            type: 'gradient',
            format: 'radial',
            stops: [{ color: '#ffffff', position: 10 }],
            angle: 45
          }
        },
        visibility: { visibility: 'PUBLIC', slug: 'summer' },
        criteria: {
          minQualityScore: 60,
          minTasksCompleted: 2,
          allowMultipleWins: true,
          allowUserSelection: true,
          externalPlatforms: ['TWITTER_IMPORT']
        }
      });
    });

    it('returns fresh Date instances for the timing', async () => {
      const result = await getSweepstakesForm({ id: SWEEPSTAKES_ID });

      const timing = expectOk(result).timing;
      expect(timing?.startDate).toBeInstanceOf(Date);
      expect(timing?.startDate).not.toBe(START);
    });
  });

  describe('when the sweepstakes has no optional sections', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(emptyRecord());
    });

    it('fills defaults for every section', async () => {
      const result = await getSweepstakesForm({ id: SWEEPSTAKES_ID });

      expect(expectOk(result)).toEqual({
        id: SWEEPSTAKES_ID,
        status: 'DRAFT',
        setup: {},
        terms: {},
        audience: {
          allowedIdentities: DEFAULT_ALLOWED_IDENTITIES,
          requirePreEntryLogin: false,
          formFields: []
        },
        timing: {
          startDate: new Date(2026, 9, 2),
          endDate: new Date(2026, 9, 9),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        prizes: [],
        tasks: [],
        visibility: { visibility: 'PRIVATE', slug: null },
        criteria: {
          minQualityScore: 50,
          minTasksCompleted: 1,
          allowMultipleWins: false,
          allowUserSelection: false,
          externalPlatforms: null
        }
      });
    });

    it('leaves the design undefined', async () => {
      const result = await getSweepstakesForm({ id: SWEEPSTAKES_ID });

      expect(expectOk(result).design).toBeUndefined();
    });
  });

  describe('when stored sections are partially filled', () => {
    beforeEach(() => {
      signIn();
    });

    it('uses the default design values when the design data is empty', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        emptyRecord({ design: { data: null } })
      );

      const result = await getSweepstakesForm({ id: SWEEPSTAKES_ID });

      expect(expectOk(result).design).toEqual({
        aspectRatio: 'VIDEO',
        displayName: true,
        displayDescription: true,
        background: { type: 'color', color: '#edf0f4' }
      });
    });

    it('fills missing gradient settings', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        emptyRecord({
          design: {
            data: {
              aspectRatio: 'SQUARE',
              background: { type: 'gradient', stops: [{}] }
            }
          }
        })
      );

      const result = await getSweepstakesForm({ id: SWEEPSTAKES_ID });

      expect(expectOk(result).design).toEqual({
        aspectRatio: 'VIDEO',
        displayName: true,
        displayDescription: true,
        background: {
          type: 'gradient',
          format: 'linear',
          stops: [{ color: '#000000', position: 0 }],
          angle: 90
        }
      });
    });

    it('defaults a solid background without a color', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        emptyRecord({ design: { data: { background: { type: 'color' } } } })
      );

      const result = await getSweepstakesForm({ id: SWEEPSTAKES_ID });

      expect(expectOk(result).design?.background).toEqual({
        type: 'color',
        color: '#edf0f4'
      });
    });

    it('defaults null form field and criteria values', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        emptyRecord({
          audience: {
            allowedIdentities: null,
            requirePreEntryLogin: null,
            regionalRestriction: { filter: null, regions: null },
            formFields: [
              {
                id: 'field-1',
                label: null,
                type: null,
                required: null,
                placeholder: null,
                minimum: 18,
                maximum: 99,
                index: null
              }
            ]
          },
          criteria: {
            minQualityScore: null,
            minTasksCompleted: null,
            allowMultipleWins: null,
            allowUserSelection: null,
            externalPlatforms: null
          },
          visibility: { visibility: null, slug: '' }
        })
      );

      const result = await getSweepstakesForm({ id: SWEEPSTAKES_ID });

      expect(expectOk(result)).toMatchObject({
        audience: {
          allowedIdentities: DEFAULT_ALLOWED_IDENTITIES,
          regionalRestriction: { regions: [] },
          requirePreEntryLogin: false,
          formFields: [
            { id: 'field-1', required: false, minimum: 18, maximum: 99 }
          ]
        },
        criteria: {
          minQualityScore: 50,
          minTasksCompleted: 1,
          allowMultipleWins: false,
          allowUserSelection: false,
          externalPlatforms: null
        },
        visibility: { visibility: 'PRIVATE', slug: '' }
      });
    });

    it('returns VALIDATION_ERROR when the external platforms are malformed', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        emptyRecord({
          criteria: {
            minQualityScore: 50,
            minTasksCompleted: 1,
            allowMultipleWins: false,
            allowUserSelection: false,
            externalPlatforms: ['NOT_A_SOURCE']
          }
        })
      );

      const result = await getSweepstakesForm({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Invalid external platforms format'
      );
    });

    it('fails output validation when the stored id is not a string', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        emptyRecord({ id: 123 })
      );

      const result = await getSweepstakesForm({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed: /
      );
    });
  });
});
