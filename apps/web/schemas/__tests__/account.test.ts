import { describe, it, expect } from 'vitest';
import {
  accountTabSchema,
  DEFAULT_ACCOUNT_TAB,
  ACCOUNT_TAB_OPTIONS,
  isAccountTab
} from '../account';

const TABS = [
  'profile',
  'history',
  'features',
  'appearance',
  'notifications',
  'danger-zone'
];

describe('accountTabSchema', () => {
  it.each(TABS)('accepts the %s tab', (tab) => {
    expect(accountTabSchema.parse(tab)).toBe(tab);
  });

  it.each(['Profile', 'danger_zone', '', 'settings'])('rejects %j', (tab) => {
    expect(accountTabSchema.safeParse(tab).success).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(accountTabSchema.safeParse(1).success).toBe(false);
  });
});

describe('ACCOUNT_TAB_OPTIONS', () => {
  it('labels every tab', () => {
    expect(ACCOUNT_TAB_OPTIONS).toEqual({
      profile: 'Profile',
      history: 'History',
      features: 'Features',
      appearance: 'Appearance',
      notifications: 'Notifications',
      'danger-zone': 'Danger Zone'
    });
  });

  it('has an option for every tab the schema accepts', () => {
    expect(Object.keys(ACCOUNT_TAB_OPTIONS)).toEqual(TABS);
  });
});

describe('isAccountTab', () => {
  it('returns true for a known tab', () => {
    expect(isAccountTab('danger-zone')).toBe(true);
  });

  it('returns false for an unknown tab', () => {
    expect(isAccountTab('billing')).toBe(false);
  });
});

describe('DEFAULT_ACCOUNT_TAB', () => {
  it('defaults the account page to the profile tab', () => {
    expect(DEFAULT_ACCOUNT_TAB).toBe('profile');
    expect(isAccountTab(DEFAULT_ACCOUNT_TAB)).toBe(true);
  });
});
