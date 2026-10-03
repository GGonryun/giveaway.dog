import { describe, it, expect, vi, afterEach } from 'vitest';
import { ApplicationError } from '@giveaway/util-errors';
import { INTEGRATIONS_SETUP_URL, toSplitActionId } from '../util';
import { buttonInteraction } from '../../__tests__/fixtures-discord-core';

describe('INTEGRATIONS_SETUP_URL', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('when the app url is configured', () => {
    it('points to the team integrations settings when a slug is given', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.dog');

      expect(INTEGRATIONS_SETUP_URL({ slug: 'good-dogs' })).toBe(
        'https://giveaway.dog/app/good-dogs/settings/integrations'
      );
    });

    it('points to the app root when the slug is undefined', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.dog');

      expect(INTEGRATIONS_SETUP_URL({ slug: undefined })).toBe(
        'https://giveaway.dog/app'
      );
    });

    it('points to the app root when the slug is empty', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

      expect(INTEGRATIONS_SETUP_URL({ slug: '' })).toBe(
        'http://localhost:3000/app'
      );
    });
  });

  describe('when the app url is missing', () => {
    it.each([undefined, ''])('throws INTERNAL_SERVER_ERROR for %j', (value) => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', value);

      let caught: unknown;
      try {
        INTEGRATIONS_SETUP_URL({ slug: 'good-dogs' });
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(ApplicationError);
      expect(caught).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Missing NEXT_PUBLIC_APP_URL environment variable'
      });
    });
  });
});

describe('toSplitActionId', () => {
  it('splits the custom id into action, operation and task id', () => {
    expect(toSplitActionId(buttonInteraction('task:enter:task-42'))).toEqual({
      action: 'task',
      operation: 'enter',
      taskId: 'task-42'
    });
  });

  it('leaves missing segments undefined', () => {
    expect(toSplitActionId(buttonInteraction('legacy'))).toEqual({
      action: 'legacy',
      operation: undefined,
      taskId: undefined
    });
  });

  it('ignores segments after the third', () => {
    expect(toSplitActionId(buttonInteraction('task:enter:t-1:extra'))).toEqual({
      action: 'task',
      operation: 'enter',
      taskId: 't-1'
    });
  });

  it('returns an empty action for an empty custom id', () => {
    expect(toSplitActionId(buttonInteraction(''))).toEqual({
      action: '',
      operation: undefined,
      taskId: undefined
    });
  });
});
