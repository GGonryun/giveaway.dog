import type {
  Prisma,
  SweepstakesStatus,
  TeamRole,
  VisibilityType
} from '@prisma/client';
import { db } from './database';

const DAY = 24 * 60 * 60 * 1000;

let sequence = 0;

export const nextId = (prefix: string) => `${prefix}-${++sequence}`;

export const bonusTask = (title = 'Bonus entry'): Prisma.InputJsonObject => ({
  type: 'BONUS_TASK',
  title,
  value: 1,
  mandatory: false,
  tasksRequired: 0
});

export const secretCodeTask = (code: string): Prisma.InputJsonObject => ({
  type: 'SECRET_CODE',
  title: 'Enter the secret code',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  code,
  caseSensitive: false
});

export const createUser = async ({
  name = nextId('user'),
  qualityScore = 100,
  ...data
}: Partial<Prisma.UserCreateInput> & { qualityScore?: number } = {}) =>
  db.user.create({
    data: {
      name,
      email: `${name}@example.com`,
      ...data,
      quality: { create: { score: qualityScore } }
    }
  });

export const createHost = async ({
  role = 'OWNER'
}: { role?: TeamRole } = {}) => {
  const user = await createUser({ accountType: 'HOST' });
  const slug = nextId('team');
  const team = await db.team.create({
    data: {
      name: slug,
      slug,
      members: { create: { userId: user.id, role } }
    }
  });
  return { user, team };
};

export type SweepstakesFixture = {
  teamId: string;
  name?: string;
  status?: SweepstakesStatus;
  visibility?: VisibilityType;
  prizes?: { name: string; quota: number }[];
  tasks?: Prisma.InputJsonObject[];
  criteria?: Omit<
    Prisma.SweepstakesWinnerCriteriaCreateWithoutSweepstakesInput,
    'id'
  >;
};

export const createSweepstakes = async ({
  teamId,
  name = 'Test giveaway',
  status = 'ACTIVE',
  visibility = 'PUBLIC',
  prizes = [{ name: 'Prize', quota: 1 }],
  tasks = [bonusTask()],
  criteria = {}
}: SweepstakesFixture) => {
  const id = nextId('sweepstakes');
  const now = Date.now();
  return db.sweepstakes.create({
    data: {
      id,
      teamId,
      status,
      details: { create: { name } },
      timing: {
        create: {
          startDate: new Date(now - DAY),
          endDate: new Date(now + DAY),
          timeZone: 'UTC'
        }
      },
      visibility: { create: { visibility, slug: id } },
      criteria: {
        create: { minQualityScore: 0, minTasksCompleted: 1, ...criteria }
      },
      prizes: {
        create: prizes.map((prize, index) => ({
          id: nextId('prize'),
          index,
          ...prize
        }))
      },
      tasks: {
        create: tasks.map((config, index) => ({
          id: nextId('task'),
          index,
          config
        }))
      }
    },
    include: {
      prizes: { orderBy: { index: 'asc' } },
      tasks: { orderBy: { index: 'asc' } }
    }
  });
};

export const createEntry = async ({
  sweepstakesId,
  taskIds,
  userId
}: {
  sweepstakesId: string;
  taskIds: string[];
  userId?: string;
}) => {
  const user = userId ? { id: userId } : await createUser();
  return db.sweepstakesParticipant.create({
    data: {
      userId: user.id,
      sweepstakesId,
      taskCompletions: {
        create: taskIds.map((taskId) => ({ taskId }))
      }
    },
    include: { taskCompletions: true }
  });
};

export const createEntries = async ({
  count,
  ...entry
}: {
  sweepstakesId: string;
  taskIds: string[];
  count: number;
}) => {
  const entries = [];
  for (let i = 0; i < count; i++) {
    entries.push(await createEntry(entry));
  }
  return entries;
};
