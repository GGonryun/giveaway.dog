import type {
  CompletionStatus,
  Prisma,
  SweepstakesFormValue,
  Task
} from '@prisma/client';
import type {
  USER_SCHEMA_SELECT_QUERY,
  UserSchema
} from '@giveaway/user-model/user';
import type {
  TASK_COMPLETIONS_SELECT_QUERY,
  TaskCompletionSchema
} from '@giveaway/task-model/completions';
import type { SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY } from '../db';
import type { SweepstakesParticipantSchema } from '../schemas';

export type UserRow = Prisma.UserGetPayload<{
  select: typeof USER_SCHEMA_SELECT_QUERY;
}>;

export type CompletionRow = Prisma.TaskCompletionGetPayload<{
  select: typeof TASK_COMPLETIONS_SELECT_QUERY;
}>;

export type ParticipantRow = Prisma.SweepstakesParticipantGetPayload<{
  include: typeof SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY;
}>;

export const BASE_DATE = new Date('2026-01-01T00:00:00.000Z');

export const daysAfterBase = (days: number) =>
  new Date(BASE_DATE.getTime() + days * 24 * 60 * 60 * 1000);

export const bonusConfig = (overrides: Record<string, unknown> = {}) => ({
  type: 'BONUS_TASK',
  title: 'Bonus entry',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  ...overrides
});

export const buildUserRow = (overrides: Partial<UserRow> = {}): UserRow => ({
  id: 'user-2',
  email: 'jane@example.com',
  name: 'Jane Doe',
  image: null,
  source: 'SIGNUP',
  createdAt: BASE_DATE,
  birthday: null,
  agents: [],
  ips: [],
  quality: [],
  emailVerified: null,
  accounts: [],
  onboarded: true,
  accountType: 'PARTICIPANT',
  username: null,
  preferredContactMethod: null,
  ...overrides
});

export const buildUserSchema = (
  overrides: Partial<UserSchema> = {}
): UserSchema => ({
  id: 'user-2',
  email: 'jane@example.com',
  name: 'Jane Doe',
  image: null,
  source: 'SIGNUP',
  birthday: null,
  createdAt: BASE_DATE,
  countryCode: 'XX',
  userAgent: 'unknown',
  qualityScore: 0,
  emailVerified: false,
  providers: [],
  onboarded: true,
  accountType: 'PARTICIPANT',
  username: null,
  preferredContactMethod: null,
  isAnonymous: true,
  ...overrides
});

export const buildTaskRow = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  sweepstakesId: 'sweep-1',
  index: 0,
  config: bonusConfig(),
  ...overrides
});

export const buildCompletionRow = ({
  id = 'tc-1',
  completedAt = BASE_DATE,
  status = 'COMPLETED',
  proof = null,
  task = buildTaskRow(),
  details = { name: 'Summer Giveaway' }
}: {
  id?: string;
  completedAt?: Date;
  status?: CompletionStatus;
  proof?: Prisma.JsonValue;
  task?: Task;
  details?: { name: string | null } | null;
} = {}): CompletionRow => ({
  id,
  completedAt,
  status,
  proof,
  task: { ...task, sweepstakes: { details } }
});

export const buildCompletion = (
  overrides: Partial<TaskCompletionSchema> = {}
): TaskCompletionSchema => ({
  id: 'tc-1',
  completedAt: BASE_DATE,
  status: 'COMPLETED',
  proof: null,
  task: {
    id: 'task-1',
    type: 'BONUS_TASK',
    title: 'Bonus entry',
    value: 1,
    mandatory: false,
    tasksRequired: 0
  },
  sweepstake: { id: 'sweep-1', name: 'Summer Giveaway' },
  ...overrides
});

export const buildFormValueRow = (
  fieldId: string,
  value: string
): SweepstakesFormValue => ({
  id: `fv-${fieldId}`,
  participantId: 'participant-1',
  fieldId,
  value,
  createdAt: BASE_DATE,
  updatedAt: BASE_DATE
});

export const buildParticipantRow = (
  overrides: Partial<ParticipantRow> = {}
): ParticipantRow => ({
  id: 'participant-1',
  userId: 'user-2',
  sweepstakesId: 'sweep-1',
  createdAt: BASE_DATE,
  updatedAt: BASE_DATE,
  user: buildUserRow(),
  taskCompletions: [],
  formValues: [],
  allocations: null,
  ...overrides
});

export const buildParticipant = (
  overrides: Partial<SweepstakesParticipantSchema> = {}
): SweepstakesParticipantSchema => ({
  id: 'participant-1',
  user: buildUserSchema(),
  allocation: null,
  completions: [],
  formValues: {},
  ...overrides
});
