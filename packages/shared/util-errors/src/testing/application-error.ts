import { expect } from 'vitest';
import { ApplicationError } from '..';

const caught = async (
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
