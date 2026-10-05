import { expect } from 'vitest';
import type { Prisma, Task, TaskCompletion } from '@prisma/client';
import { ApplicationError } from '@giveaway/util-errors';
import { asPrismaClient } from './prisma';

export const db = asPrismaClient();

export const IDS = {
  userId: 'user-1',
  participantId: 'participant-1',
  teamId: 'team-1',
  sweepstakesId: 'sweep-1'
} as const;

export const BASE_TASK = {
  title: 'Task title',
  value: 1,
  mandatory: false,
  tasksRequired: 0
};

export const FIXED_DATE = new Date('2024-01-01T00:00:00.000Z');

export const storedTask = (
  id: string,
  config: Prisma.JsonObject | null,
  sweepstakesId: string = IDS.sweepstakesId
): Task => ({
  id,
  sweepstakesId,
  index: 0,
  config
});

export const taskCompletion = (
  taskId: string,
  overrides: Partial<TaskCompletion> = {}
): TaskCompletion => ({
  id: `completion-${taskId}`,
  participantId: IDS.participantId,
  taskId,
  completedAt: FIXED_DATE,
  proof: null,
  reason: null,
  status: 'COMPLETED',
  ...overrides
});

export const caught = async (
  action: Promise<unknown> | (() => unknown)
): Promise<unknown> => {
  try {
    await (typeof action === 'function' ? action() : action);
  } catch (error) {
    return error;
  }
  throw new Error('Expected the action to throw');
};

export const applicationError = async (
  action: Promise<unknown> | (() => unknown)
): Promise<ApplicationError> => {
  const error = await caught(action);
  expect(error).toBeInstanceOf(ApplicationError);
  return error as ApplicationError;
};

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

export const textResponse = (text: string, status: number) =>
  new Response(text, { status });
