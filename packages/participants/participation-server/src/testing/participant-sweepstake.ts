import {
  buildSelectedUser,
  daysFromFixedNow
} from '@giveaway/testing-server/fixtures-procedures-browse-marketing-pickers';

export const START = daysFromFixedNow(-2);
export const END = daysFromFixedNow(5);
export const CREATED_AT = daysFromFixedNow(-10);

export const bonusConfig = (title: string, value: number) => ({
  type: 'BONUS_TASK',
  title,
  value,
  mandatory: false,
  tasksRequired: 0
});

export const taskRow = (id: string, config: unknown) => ({
  id,
  sweepstakesId: 'sw-1',
  index: 0,
  config
});

export const drawRow = (
  id: string,
  task: ReturnType<typeof taskRow>,
  winnerId = 'winner-1'
) => ({
  id,
  prizeId: 'prize-1',
  taskCompletionId: `tc-${id}`,
  result: 'WINNER',
  disqualificationReason: null,
  previousDrawId: null,
  createdAt: daysFromFixedNow(-1),
  updatedAt: daysFromFixedNow(-1),
  taskCompletion: {
    id: `tc-${id}`,
    participantId: `participant-${winnerId}`,
    taskId: task.id,
    status: 'COMPLETED',
    proof: null,
    reason: null,
    completedAt: daysFromFixedNow(-1),
    task,
    participant: {
      id: `participant-${winnerId}`,
      userId: winnerId,
      sweepstakesId: 'sw-1',
      user: buildSelectedUser({ id: winnerId, name: 'Winner' })
    }
  }
});

export type PrizeRow = {
  id: string;
  sweepstakesId: string;
  name: string | null;
  index: number;
  quota: number | null;
  draws: ReturnType<typeof drawRow>[];
};

export const prizeRow = (overrides: Partial<PrizeRow> = {}): PrizeRow => ({
  id: 'prize-1',
  sweepstakesId: 'sw-1',
  name: 'Gift Card',
  index: 0,
  quota: 2,
  draws: [],
  ...overrides
});

export const sweepstakesRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'sw-1',
  status: 'ACTIVE',
  teamId: 'team-1',
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  team: {
    id: 'team-1',
    name: 'Acme',
    slug: 'acme',
    logo: 'https://example.com/logo.png',
    links: null,
    tier: 'FREE',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  },
  details: {
    id: 'details-1',
    sweepstakesId: 'sw-1',
    name: 'Great Giveaway',
    description: 'Win something nice',
    banner: 'https://example.com/banner.png'
  },
  timing: {
    id: 'timing-1',
    sweepstakesId: 'sw-1',
    startDate: START,
    endDate: END,
    timeZone: 'UTC'
  },
  terms: {
    id: 'terms-1',
    sweepstakesId: 'sw-1',
    type: 'CUSTOM',
    text: 'Official rules',
    sponsorName: null,
    sponsorAddress: null,
    winnerSelectionMethod: null,
    notificationTimeframeDays: null,
    maxEntriesPerUser: null,
    claimDeadlineDays: null,
    governingLawCountry: null,
    privacyPolicyUrl: null,
    additionalTerms: null
  },
  audience: {
    id: 'audience-1',
    sweepstakesId: 'sw-1',
    allowedIdentities: ['TWITTER', 'EMAIL'],
    requirePreEntryLogin: false,
    requireEmail: null,
    regionalRestriction: null,
    minimumAgeRestriction: null,
    formFields: []
  },
  design: {
    id: 'design-1',
    sweepstakesId: 'sw-1',
    data: {
      aspectRatio: 'NONE',
      displayName: true,
      displayDescription: false,
      background: { type: 'color', color: '#ffffff' }
    }
  },
  visibility: {
    id: 'visibility-1',
    sweepstakesId: 'sw-1',
    visibility: 'PUBLIC',
    slug: 'great-giveaway',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  },
  criteria: {
    id: 'criteria-1',
    sweepstakesId: 'sw-1',
    minTasksCompleted: 2,
    minQualityScore: 60,
    allowMultipleWins: true,
    allowUserSelection: false,
    externalPlatforms: null
  },
  prizes: [prizeRow()],
  tasks: [taskRow('task-1', bonusConfig('Say hi', 2))],
  ...overrides
});
