import type { AllocationStatisticsSchema } from '@giveaway/allocation-model/schemas';
import type { SweepstakesFormFieldSchema } from '@giveaway/custom-fields-model/schemas';
import { DEFAULT_MINIMUM_AGE_FIELD } from '@giveaway/custom-fields-model/defaults';
import type { ProviderSchema } from '@giveaway/integration-model/providers';
import type { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import { DEFAULT_ALLOWED_IDENTITIES } from '@giveaway/app-config/settings';
import type { TaskCompletionSchema } from '@/lib/task/completions';
import type {
  BonusTaskSchema,
  TaskSchema,
  UserEntriesSchema
} from '@/lib/task/schemas';
import {
  DEFAULT_CLAIM_DEADLINE_DAYS,
  DEFAULT_DESIGN_DATA,
  DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
  DEFAULT_MIN_QUALITY_SCORE,
  DEFAULT_MIN_TASK_COMPLETED,
  DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
  DEFAULT_SPONSOR_NAME,
  DEFAULT_WINNER_SELECTION_METHOD
} from '@/schemas/giveaway/defaults';
import type { PublicSweepstakeSchema } from '@/schemas/giveaway/public';
import type {
  GiveawayFormAudience,
  GiveawayHostSchema,
  GiveawayParticipationSchema,
  GiveawayPrizeSchema,
  GiveawaySchema,
  Prize,
  SweepstakesPrizeSchema,
  SweepstakesWinnerCriteriaSchema
} from '@/schemas/giveaway/schemas';
import type { DetailedUserTeam } from '@giveaway/team-model/teams';
import type { UserProfileSchema, UserSchema } from '@giveaway/user-model/user';

export const NOW = new Date(2026, 9, 1, 12, 0, 0);
export const START_DATE = new Date(2026, 8, 24, 12, 0, 0);
export const END_DATE = new Date(2026, 9, 8, 12, 0, 0);

type PrizeDraw = GiveawayPrizeSchema['draws'][number];
type SweepstakesPrizeDraw = SweepstakesPrizeSchema['draws'][number];

export const buildProvider = (
  overrides: Partial<ProviderSchema> = {}
): ProviderSchema => ({
  type: 'TWITTER',
  scopes: [],
  label: 'janedoe',
  link: 'https://x.com/janedoe',
  status: 'ACTIVE',
  ...overrides
});

export const buildUserProfile = (
  overrides: Partial<UserProfileSchema> = {}
): UserProfileSchema => ({
  id: 'user-1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  emailVerified: true,
  image: null,
  countryCode: 'US',
  userAgent: 'test-agent',
  birthday: null,
  qualityScore: 80,
  providers: [],
  source: 'SIGNUP',
  username: 'janedoe',
  onboarded: true,
  accountType: 'PARTICIPANT',
  preferredContactMethod: null,
  ...overrides
});

export const buildUser = (overrides: Partial<UserSchema> = {}): UserSchema => ({
  ...buildUserProfile(),
  createdAt: new Date(2026, 0, 15, 9, 30),
  isAnonymous: false,
  ...overrides
});

export const buildTask = (
  overrides: Partial<BonusTaskSchema> = {}
): TaskSchema => ({
  id: 'task-1',
  type: 'BONUS_TASK',
  title: 'Say hello',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  ...overrides
});

export const buildCompletion = (
  overrides: Partial<TaskCompletionSchema> = {}
): TaskCompletionSchema => ({
  id: 'completion-1',
  completedAt: new Date(2026, 8, 28, 15, 45),
  status: 'COMPLETED',
  proof: null,
  task: buildTask(),
  sweepstake: { id: 'sweep-1', name: 'Summer Giveaway' },
  ...overrides
});

export const buildParticipant = (
  overrides: Partial<SweepstakesParticipantSchema> = {}
): SweepstakesParticipantSchema => ({
  id: 'participant-1',
  user: buildUser(),
  completions: [],
  allocation: null,
  formValues: {},
  ...overrides
});

export const buildPrize = (overrides: Partial<Prize> = {}): Prize => ({
  id: 'prize-1',
  name: 'Gaming Headset',
  quota: 1,
  ...overrides
});

export const buildUsernameField = (
  overrides: Partial<
    Extract<SweepstakesFormFieldSchema, { type: 'USERNAME' }>
  > = {}
): SweepstakesFormFieldSchema => ({
  id: 'field-username',
  type: 'USERNAME',
  label: 'Username',
  placeholder: null,
  required: true,
  ...overrides
});

export const buildEmailField = (
  overrides: Partial<
    Extract<SweepstakesFormFieldSchema, { type: 'EMAIL' }>
  > = {}
): SweepstakesFormFieldSchema => ({
  id: 'field-email',
  type: 'EMAIL',
  label: 'Email',
  placeholder: null,
  ...overrides
});

export const buildAgeField = (
  overrides: Partial<Extract<SweepstakesFormFieldSchema, { type: 'AGE' }>> = {}
): SweepstakesFormFieldSchema => ({
  id: 'field-age',
  ...DEFAULT_MINIMUM_AGE_FIELD,
  ...overrides
});

export const buildTwitterField = (
  overrides: Partial<
    Extract<SweepstakesFormFieldSchema, { type: 'TWITTER' }>
  > = {}
): SweepstakesFormFieldSchema => ({
  id: 'field-twitter',
  type: 'TWITTER',
  label: 'X profile',
  placeholder: null,
  required: true,
  ...overrides
});

export const buildAudience = (
  overrides: Partial<GiveawayFormAudience> = {}
): GiveawayFormAudience => ({
  allowedIdentities: DEFAULT_ALLOWED_IDENTITIES,
  regionalRestriction: null,
  requirePreEntryLogin: false,
  formFields: [],
  ...overrides
});

export const buildCriteria = (
  overrides: Partial<SweepstakesWinnerCriteriaSchema> = {}
): SweepstakesWinnerCriteriaSchema => ({
  minTasksCompleted: DEFAULT_MIN_TASK_COMPLETED,
  minQualityScore: DEFAULT_MIN_QUALITY_SCORE,
  allowMultipleWins: false,
  allowUserSelection: false,
  externalPlatforms: null,
  ...overrides
});

export const buildSweepstakes = (
  overrides: Partial<GiveawaySchema> = {}
): GiveawaySchema => ({
  id: 'sweep-1',
  status: 'RUNNING',
  setup: {
    name: 'Summer Giveaway',
    description: '<p>Win a brand new headset!</p>',
    banner: 'https://cdn.example.com/banner.png'
  },
  terms: {
    type: 'TEMPLATE',
    sponsorName: DEFAULT_SPONSOR_NAME,
    sponsorAddress: '',
    winnerSelectionMethod: DEFAULT_WINNER_SELECTION_METHOD,
    notificationTimeframeDays: DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
    claimDeadlineDays: DEFAULT_CLAIM_DEADLINE_DAYS,
    governingLawCountry: DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
    privacyPolicyUrl: '',
    maxEntriesPerUser: null,
    additionalTerms: null
  },
  timing: { startDate: START_DATE, endDate: END_DATE, timeZone: 'UTC' },
  audience: buildAudience(),
  tasks: [buildTask()],
  prizes: [buildPrize()],
  design: DEFAULT_DESIGN_DATA,
  visibility: { visibility: 'PUBLIC', slug: 'summer-giveaway' },
  criteria: buildCriteria(),
  ...overrides
});

export const buildHost = (
  overrides: Partial<GiveawayHostSchema> = {}
): GiveawayHostSchema => ({
  id: 'team-1',
  slug: 'acme',
  name: 'Acme Games',
  logo: null,
  links: [],
  ...overrides
});

export const buildTeam = (
  overrides: Partial<DetailedUserTeam> = {}
): DetailedUserTeam => ({
  id: 'team-1',
  name: 'Acme Games',
  slug: 'acme',
  logo: 'https://cdn.example.com/logo.png',
  links: null,
  memberCount: 3,
  tier: 'PRO',
  role: 'OWNER',
  ...overrides
});

export const buildParticipation = (
  overrides: Partial<GiveawayParticipationSchema> = {}
): GiveawayParticipationSchema => ({
  totalEntries: 42,
  usersByTask: { 'task-1': 12 },
  totalUsers: 12,
  ...overrides
});

export const buildPrizeDraw = (
  overrides: Partial<PrizeDraw> = {}
): PrizeDraw => ({
  id: 'draw-1',
  result: 'WINNER',
  disqualificationReason: null,
  createdAt: new Date(2026, 9, 9, 10, 0),
  updatedAt: new Date(2026, 9, 9, 10, 0),
  task: { id: 'task-1', type: 'BONUS_TASK', title: 'Say hello' },
  user: buildUserProfile(),
  ...overrides
});

export const buildGiveawayPrize = (
  overrides: Partial<GiveawayPrizeSchema> = {}
): GiveawayPrizeSchema => ({
  prizeId: 'prize-1',
  prizeName: 'Gaming Headset',
  quota: 1,
  draws: [],
  ...overrides
});

export const buildSweepstakesPrizeDraw = (
  overrides: Partial<SweepstakesPrizeDraw> = {}
): SweepstakesPrizeDraw => ({
  id: 'draw-1',
  createdAt: new Date(2026, 9, 9, 10, 0),
  updatedAt: new Date(2026, 9, 9, 10, 0),
  result: 'WINNER',
  disqualificationReason: null,
  participant: buildUserProfile(),
  taskCompletion: buildCompletion(),
  ...overrides
});

export const buildSweepstakesPrize = (
  overrides: Partial<SweepstakesPrizeSchema> = {}
): SweepstakesPrizeSchema => ({
  id: 'prize-1',
  name: 'Gaming Headset',
  position: 0,
  quota: 1,
  draws: [],
  ...overrides
});

export const buildUserEntry = (
  overrides: Partial<UserEntriesSchema> = {}
): UserEntriesSchema => ({
  id: 'entry-1',
  user: buildUser(),
  task: buildTask(),
  status: 'COMPLETED',
  proof: null,
  completedAt: new Date(2026, 8, 30, 12, 0).getTime(),
  reason: null,
  ...overrides
});

export const buildPublicSweepstakes = (
  overrides: Partial<PublicSweepstakeSchema> = {}
): PublicSweepstakeSchema => ({
  id: 'sweep-1',
  slug: 'summer-giveaway',
  name: 'Summer Giveaway',
  description: 'Win a brand new headset!',
  banner: 'https://cdn.example.com/banner.png',
  startDate: START_DATE,
  endDate: END_DATE,
  prizes: 2,
  host: { id: 'team-1', slug: 'acme', name: 'Acme Games' },
  status: 'RUNNING',
  participants: 12,
  featured: false,
  ...overrides
});

export const buildAllocations = (
  overrides: Partial<AllocationStatisticsSchema> = {}
): AllocationStatisticsSchema => ({
  totalAllocations: 4,
  allocationsByPrize: [
    {
      prizeId: 'prize-1',
      prizeName: 'Gaming Headset',
      allocationCount: 3,
      badge: 'popular'
    },
    {
      prizeId: 'prize-2',
      prizeName: 'Gift Card',
      allocationCount: 1,
      badge: 'unpopular'
    }
  ],
  ...overrides
});

const GENERATED_ID = /(radix-)?_r_[0-9a-z]+_/g;

export const withStableIds = <T extends Element>(element: T): T => {
  const clone = element.cloneNode(true) as T;
  [clone, ...Array.from(clone.querySelectorAll('*'))].forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      const value = attribute.value.replace(GENERATED_ID, 'generated-id');
      if (value !== attribute.value) {
        node.setAttribute(attribute.name, value);
      }
    });
  });
  return clone;
};
