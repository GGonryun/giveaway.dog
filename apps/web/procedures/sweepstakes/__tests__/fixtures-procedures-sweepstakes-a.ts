import {
  SweepstakesStatus,
  TeamRole,
  TeamTier,
  UserAccountType,
  UserSource
} from '@prisma/client';
import { TEST_USER } from '@/test/session';

export const TEAM_ID = 'team-1';
export const TEAM_SLUG = 'acme';
export const SWEEPSTAKES_ID = 'sw-1';

const FIXED_DATE = new Date('2026-01-01T00:00:00.000Z');

export const buildMember = ({
  userId = TEST_USER.id,
  role = TeamRole.OWNER
}: { userId?: string; role?: TeamRole } = {}) => ({
  id: `membership-${userId}`,
  userId,
  teamId: TEAM_ID,
  role,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE
});

type Member = ReturnType<typeof buildMember>;

export const buildTeam = (
  overrides: Partial<{
    id: string;
    name: string;
    slug: string;
    tier: TeamTier;
    members: Member[];
  }> = {}
) => ({
  id: TEAM_ID,
  name: 'Acme Inc',
  slug: TEAM_SLUG,
  tier: TeamTier.FREE,
  logo: 'https://example.com/logo.png',
  links: null,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
  members: [buildMember()],
  ...overrides
});

export const buildTeamSweepstakes = (
  overrides: Partial<{
    id: string;
    status: SweepstakesStatus;
    teamId: string | null;
    team: ReturnType<typeof buildTeam> | null;
  }> = {}
) => ({
  id: SWEEPSTAKES_ID,
  status: SweepstakesStatus.DRAFT,
  teamId: TEAM_ID,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
  team: buildTeam(),
  ...overrides
});

export const buildUserRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'entrant-1',
  email: 'entrant@example.com',
  name: 'Entrant',
  image: 'https://example.com/entrant.png',
  source: UserSource.SIGNUP,
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  birthday: null,
  agents: [{ agent: { id: 'agent-1' } }],
  ips: [{ ip: { countryCode: 'US' } }],
  quality: [{ score: 80 }],
  emailVerified: new Date('2026-01-03T00:00:00.000Z'),
  accounts: [
    {
      provider: 'twitter',
      scope: 'tweet.read users.read',
      label: '@entrant',
      link: 'https://x.com/entrant',
      status: 'ACTIVE'
    }
  ],
  onboarded: true,
  accountType: UserAccountType.PARTICIPANT,
  username: 'entrant',
  preferredContactMethod: null,
  ...overrides
});

export const expectedUserSchema = (
  overrides: Record<string, unknown> = {}
) => ({
  id: 'entrant-1',
  email: 'entrant@example.com',
  name: 'Entrant',
  image: 'https://example.com/entrant.png',
  source: UserSource.SIGNUP,
  birthday: null,
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  countryCode: 'US',
  userAgent: 'agent-1',
  qualityScore: 80,
  emailVerified: true,
  providers: [
    {
      type: 'TWITTER',
      scopes: ['tweet.read', 'users.read'],
      label: '@entrant',
      link: 'https://x.com/entrant',
      status: 'ACTIVE'
    }
  ],
  onboarded: true,
  accountType: UserAccountType.PARTICIPANT,
  username: 'entrant',
  preferredContactMethod: null,
  isAnonymous: false,
  ...overrides
});

export const bonusTaskConfig = (title = 'Bonus entry') => ({
  type: 'BONUS_TASK',
  title,
  value: 1,
  mandatory: false,
  tasksRequired: 0
});

export const expectedBonusTask = (id: string, title = 'Bonus entry') => ({
  id,
  type: 'BONUS_TASK',
  title,
  value: 1,
  mandatory: false,
  tasksRequired: 0
});

export const buildTaskRecord = (
  overrides: Partial<{
    id: string;
    sweepstakesId: string;
    index: number | null;
    config: unknown;
  }> = {}
) => ({
  id: 'task-1',
  sweepstakesId: SWEEPSTAKES_ID,
  index: 0,
  config: bonusTaskConfig(),
  ...overrides
});
