import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SETTINGS_TAB,
  SETTINGS_TAB_OPTIONS,
  isSettingsTab,
  matchSettingsTab,
  settingsTabSchema
} from '../tabs';

describe('settings tabs', () => {
  describe('SETTINGS_TAB_OPTIONS', () => {
    it('labels the four settings tabs', () => {
      expect(SETTINGS_TAB_OPTIONS).toEqual({
        profile: 'Profile',
        socials: 'Socials',
        team: 'Team',
        integrations: 'Integrations'
      });
    });

    it('has the same keys as the schema options', () => {
      expect(Object.keys(SETTINGS_TAB_OPTIONS)).toEqual(
        settingsTabSchema.options
      );
    });
  });

  describe('settingsTabSchema', () => {
    it.each(['profile', 'socials', 'team', 'integrations'])(
      'accepts %s',
      (tab) => {
        expect(settingsTabSchema.parse(tab)).toBe(tab);
      }
    );

    it.each(['Profile', 'billing', '', 'team ', null])('rejects %s', (tab) => {
      expect(settingsTabSchema.safeParse(tab).success).toBe(false);
    });
  });

  describe('isSettingsTab', () => {
    it('returns true for a known tab', () => {
      expect(isSettingsTab('socials')).toBe(true);
    });

    it('returns false for an unknown tab', () => {
      expect(isSettingsTab('billing')).toBe(false);
    });
  });

  describe('DEFAULT_SETTINGS_TAB', () => {
    it('is the profile tab', () => {
      expect(DEFAULT_SETTINGS_TAB).toBe('profile');
      expect(isSettingsTab(DEFAULT_SETTINGS_TAB)).toBe(true);
    });
  });

  describe('matchSettingsTab', () => {
    it.each([
      ['/app/acme/settings/profile', 'profile'],
      ['/app/acme/settings/socials', 'socials'],
      ['/app/acme/settings/team', 'team'],
      ['/app/acme/settings/integrations', 'integrations']
    ])('extracts the tab from %s', (path, tab) => {
      expect(matchSettingsTab(path)).toBe(tab);
    });

    it('ignores anything after the tab segment', () => {
      expect(matchSettingsTab('/app/acme/settings/team/members?x=1')).toBe(
        'team'
      );
    });

    it('returns null for the settings root without a tab', () => {
      expect(matchSettingsTab('/app/acme/settings')).toBeNull();
    });

    it('returns null for the settings root with a trailing slash', () => {
      expect(matchSettingsTab('/app/acme/settings/')).toBeNull();
    });

    it('returns null for an unknown tab', () => {
      expect(matchSettingsTab('/app/acme/settings/billing')).toBeNull();
    });

    it('returns null for paths outside a team settings page', () => {
      expect(matchSettingsTab('/app/acme/sweepstakes/profile')).toBeNull();
    });

    it('returns null when the path is not anchored at /app', () => {
      expect(matchSettingsTab('/en/app/acme/settings/profile')).toBeNull();
    });

    it('returns null when the team slug is missing', () => {
      expect(matchSettingsTab('/app//settings/profile')).toBeNull();
    });

    it('returns null when the settings segment has a suffix', () => {
      expect(matchSettingsTab('/app/acme/settingsx/profile')).toBeNull();
    });

    it('returns null for an empty path', () => {
      expect(matchSettingsTab('')).toBeNull();
    });
  });
});
