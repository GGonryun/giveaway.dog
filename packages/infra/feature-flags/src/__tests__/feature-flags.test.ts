import { describe, it, expect } from 'vitest';
import {
  BASIC_DASHBOARD_FEATURE_FLAG_KEY,
  HOST_DASHBOARD_FEATURE_FLAG_KEY,
  DEFAULT_USER_FEATURE_FLAGS,
  USER_FEATURE_FLAG_LABELS,
  USER_FEATURE_FLAG_DESCRIPTIONS
} from '../feature-flags';

describe('feature flag keys', () => {
  it('uses the stored key strings', () => {
    expect(BASIC_DASHBOARD_FEATURE_FLAG_KEY).toBe('basic-user');
    expect(HOST_DASHBOARD_FEATURE_FLAG_KEY).toBe('host-dashboard');
  });
});

describe('DEFAULT_USER_FEATURE_FLAGS', () => {
  it('enables participation and disables hosting by default', () => {
    expect(DEFAULT_USER_FEATURE_FLAGS).toEqual({
      'basic-user': true,
      'host-dashboard': false
    });
  });
});

describe('USER_FEATURE_FLAG_LABELS', () => {
  it('labels each flag', () => {
    expect(USER_FEATURE_FLAG_LABELS).toEqual({
      'basic-user': 'Participate in Sweepstakes',
      'host-dashboard': 'Host Sweepstakes'
    });
  });
});

describe('USER_FEATURE_FLAG_DESCRIPTIONS', () => {
  it('describes each flag', () => {
    expect(USER_FEATURE_FLAG_DESCRIPTIONS).toEqual({
      'basic-user':
        'Join and enter sweepstakes hosted by others. Complete tasks to earn entries and increase your chances of winning prizes.',
      'host-dashboard':
        'Create and manage your own sweepstakes. Set up tasks, manage participants, and select winners for your giveaways.'
    });
  });

  it('covers the same keys as the defaults and labels', () => {
    const keys = Object.keys(DEFAULT_USER_FEATURE_FLAGS);

    expect(Object.keys(USER_FEATURE_FLAG_LABELS)).toEqual(keys);
    expect(Object.keys(USER_FEATURE_FLAG_DESCRIPTIONS)).toEqual(keys);
  });
});
