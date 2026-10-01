import type { Prisma, TeamRole, TeamTier, UserSource } from '@prisma/client';
import type { EligibleTaskCompletion } from '@/lib/task/queries';
import type { ExpandedEligibleTaskCompletion } from '../completions';
import { prismaMock } from '@/test/prisma';

export const BASE_DATE = new Date('2024-01-01T00:00:00.000Z');

export const bonusTaskConfig = (value = 1) => ({
  type: 'BONUS_TASK',
  title: 'Bonus',
  value,
  mandatory: false,
  tasksRequired: 0
});

export const twitterLikeImportTaskConfig = (
  value: number,
  verifiedBonus: number | null
) => ({
  type: 'TWITTER_LIKE_IMPORT',
  title: 'Like our post',
  value,
  mandatory: false,
  tasksRequired: 0,
  tweetId: 'https://x.com/giveawaydog/status/1234567890',
  importingAccount: 'integration-1',
  verifiedBonus
});

export const twitterProof = (twitterVerified: boolean) => ({
  source: 'twitter_import',
  twitterUserId: 'tw-1',
  twitterUsername: 'alice',
  twitterVerified,
  importedAt: '2024-01-01T00:00:00.000Z',
  validatedBy: 'system'
});

export type CompletionOptions = {
  id?: string;
  userId?: string;
  participantId?: string;
  qualityScore?: number | null;
  source?: UserSource;
  taskId?: string;
  taskConfig?: Prisma.JsonValue;
  proof?: Prisma.JsonValue;
};

export const buildCompletion = (
  options: CompletionOptions = {}
): EligibleTaskCompletion => {
  const userId = options.userId ?? 'user-a';
  const participantId = options.participantId ?? `participant-${userId}`;
  const taskId = options.taskId ?? 'task-1';
  const quality =
    options.qualityScore === null
      ? []
      : [
          {
            id: `quality-${userId}`,
            userId,
            score: options.qualityScore ?? 100,
            createdAt: BASE_DATE,
            updatedAt: BASE_DATE
          }
        ];

  return {
    id: options.id ?? `completion-${userId}`,
    taskId,
    participantId,
    completedAt: BASE_DATE,
    proof: options.proof ?? null,
    status: 'COMPLETED',
    reason: null,
    participant: {
      id: participantId,
      userId,
      sweepstakesId: 'sw-1',
      createdAt: BASE_DATE,
      updatedAt: BASE_DATE,
      user: {
        id: userId,
        name: `Name ${userId}`,
        email: null,
        emailVerified: null,
        username: null,
        birthday: null,
        image: null,
        emoji: null,
        onboarded: true,
        accountType: 'PARTICIPANT',
        createdAt: BASE_DATE,
        updatedAt: BASE_DATE,
        source: options.source ?? 'SIGNUP',
        preferredContactMethod: null,
        quality
      }
    },
    task: {
      id: taskId,
      sweepstakesId: 'sw-1',
      index: 0,
      config: options.taskConfig ?? bonusTaskConfig()
    }
  };
};

export const buildExpandedCompletion = (
  options: CompletionOptions & { value?: number } = {}
): ExpandedEligibleTaskCompletion => ({
  ...buildCompletion(options),
  value: options.value ?? 1
});

export const buildCriteriaRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'criteria-1',
  sweepstakesId: 'sw-1',
  minTasksCompleted: 0,
  minQualityScore: 0,
  allowMultipleWins: false,
  allowUserSelection: false,
  externalPlatforms: null,
  ...overrides
});

export const buildTeamSweepstakes = (
  options: { userId?: string; role?: TeamRole; tier?: TeamTier } = {}
) => ({
  id: 'sw-1',
  team: {
    id: 'team-1',
    tier: options.tier ?? 'FREE',
    members: [
      {
        id: 'membership-1',
        userId: options.userId ?? 'user-1',
        role: options.role ?? 'OWNER'
      }
    ]
  }
});

export const buildAllocation = (
  participantId: string,
  prizeId: string
): Prisma.SweepstakesAllocationGetPayload<{}> => ({
  id: `allocation-${participantId}-${prizeId}`,
  participantId,
  prizeId,
  createdAt: BASE_DATE,
  updatedAt: BASE_DATE
});

type SweepstakesLookupArgs = {
  include?: { criteria?: boolean; team?: unknown };
};

export const givenSweepstakesLookups = (
  options: {
    criteria?: Record<string, unknown> | null;
    team?: ReturnType<typeof buildTeamSweepstakes> | null;
  } = {}
) => {
  const criteria =
    options.criteria === undefined ? buildCriteriaRow() : options.criteria;
  const team =
    options.team === undefined ? buildTeamSweepstakes() : options.team;
  prismaMock.sweepstakes.findUnique.mockImplementation(
    async (args: SweepstakesLookupArgs) => {
      if (args.include?.criteria) {
        return { id: 'sw-1', criteria };
      }
      if (args.include?.team) {
        return team;
      }
      return null;
    }
  );
};
