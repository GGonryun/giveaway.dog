import { describe, it, expect, vi, afterEach } from 'vitest';
import { INTEGRATIONS_SETUP_URL, toSplitActionId } from '../util';
import { buttonInteraction } from '@giveaway/discord-model/testing/fixtures-discord-model';

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
    it.each([undefined, ''])('points to the deployment URL for %j', (value) => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', value);
      vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', undefined);
      vi.stubEnv('VERCEL_URL', 'giveaway-abc123-team.vercel.app');

      expect(INTEGRATIONS_SETUP_URL({ slug: 'good-dogs' })).toBe(
        'https://giveaway-abc123-team.vercel.app/app/good-dogs/settings/integrations'
      );
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
