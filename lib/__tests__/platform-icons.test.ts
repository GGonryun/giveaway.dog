import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CAROUSEL_PLATFORMS,
  PLATFORM_ICONS,
  PLATFORM_LABELS,
  PLATFORM_THEMES,
  PLATFORM_TOOLTIP_THEMES,
  SHOW_ON_CAROUSEL,
  getPlatformIcon,
  getPlatformLabel,
  getPlatformTheme,
  getPlatformTooltipTheme,
  type PlatformId
} from '../platform-icons';

const PLATFORM_IDS: PlatformId[] = [
  'x',
  'bluesky',
  'twitch',
  'tiktok',
  'kick',
  'facebook',
  'snapchat',
  'threads',
  'linkedin',
  'pinterest',
  'reddit',
  'instagram',
  'youtube',
  'discord',
  'tumblr',
  'github',
  'google',
  'patreon',
  'producthunt',
  'coinbase',
  'spotify',
  'steam',
  'velora'
];

const UNKNOWN = 'myspace' as PlatformId;

const sortedKeys = (value: object) => Object.keys(value).sort();

describe('platform icons', () => {
  describe('lookup tables', () => {
    it('define an icon for every platform', () => {
      expect(sortedKeys(PLATFORM_ICONS)).toEqual([...PLATFORM_IDS].sort());
    });

    it.each([
      ['labels', PLATFORM_LABELS],
      ['themes', PLATFORM_THEMES],
      ['tooltip themes', PLATFORM_TOOLTIP_THEMES],
      ['carousel flags', SHOW_ON_CAROUSEL]
    ])('define %s for the same platforms as the icons', (_name, table) => {
      expect(sortedKeys(table)).toEqual(sortedKeys(PLATFORM_ICONS));
    });

    it('stores light icons under /platforms named after the platform id', () => {
      for (const id of PLATFORM_IDS) {
        const extension = id === 'velora' ? 'png' : 'svg';
        expect(PLATFORM_ICONS[id].light).toBe(`/platforms/${id}.${extension}`);
      }
    });

    it('provides dark icons only for threads, github and patreon', () => {
      const withDark = PLATFORM_IDS.filter((id) => PLATFORM_ICONS[id].dark);

      expect(withDark).toEqual(['threads', 'github', 'patreon']);
      for (const id of withDark) {
        expect(PLATFORM_ICONS[id].dark).toBe(`/platforms/${id}-white.svg`);
      }
    });

    it('uses six digit hex colors for every theme', () => {
      for (const id of PLATFORM_IDS) {
        expect(PLATFORM_THEMES[id]).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('uses white tooltip text everywhere except velora', () => {
      const darkText = PLATFORM_IDS.filter(
        (id) => PLATFORM_TOOLTIP_THEMES[id].text !== 'white'
      );

      expect(darkText).toEqual(['velora']);
      expect(PLATFORM_TOOLTIP_THEMES.velora).toEqual({
        bg: 'velora-1',
        text: 'black'
      });
    });

    it('shows every platform on the carousel', () => {
      expect(Object.values(SHOW_ON_CAROUSEL).every(Boolean)).toBe(true);
    });
  });

  describe('CAROUSEL_PLATFORMS', () => {
    it('lists every platform in declaration order', () => {
      expect(CAROUSEL_PLATFORMS).toEqual(PLATFORM_IDS);
    });
  });

  describe('getPlatformIcon', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns the light icon when no theme is given', () => {
      expect(getPlatformIcon('github')).toBe('/platforms/github.svg');
    });

    it('returns the light icon for a null theme', () => {
      expect(getPlatformIcon('github', null)).toBe('/platforms/github.svg');
    });

    it('returns the light icon for the light theme', () => {
      expect(getPlatformIcon('threads', 'light')).toBe(
        '/platforms/threads.svg'
      );
    });

    it('returns the dark icon for the dark theme when one exists', () => {
      expect(getPlatformIcon('patreon', 'dark')).toBe(
        '/platforms/patreon-white.svg'
      );
    });

    it('falls back to the light icon for the dark theme when no dark icon exists', () => {
      expect(getPlatformIcon('x', 'dark')).toBe('/platforms/x.svg');
    });

    it('returns the default icon for an unknown platform', () => {
      expect(getPlatformIcon(UNKNOWN, 'dark')).toBe('/platforms/default.svg');
    });

    it('warns when the platform icon is unknown', () => {
      getPlatformIcon(UNKNOWN);

      expect(console.warn).toHaveBeenCalledWith(
        'Platform icon not found for: myspace'
      );
    });

    it('does not warn for known platforms', () => {
      getPlatformIcon('x');

      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('getPlatformLabel', () => {
    it.each([
      ['x', 'Twitter/X'],
      ['producthunt', 'Product Hunt'],
      ['linkedin', 'LinkedIn'],
      ['velora', 'Velora']
    ] as [PlatformId, string][])('returns %s as %s', (id, label) => {
      expect(getPlatformLabel(id)).toBe(label);
    });

    it('falls back to the platform id for unknown platforms', () => {
      expect(getPlatformLabel(UNKNOWN)).toBe('myspace');
    });
  });

  describe('getPlatformTheme', () => {
    it('returns the brand color of the platform', () => {
      expect(getPlatformTheme('twitch')).toBe('#9146FF');
    });

    it('returns undefined for unknown platforms', () => {
      expect(getPlatformTheme(UNKNOWN)).toBeUndefined();
    });
  });

  describe('getPlatformTooltipTheme', () => {
    it('returns the tooltip theme of the platform', () => {
      expect(getPlatformTooltipTheme('discord')).toEqual({
        bg: 'discord-1',
        text: 'white'
      });
    });

    it('falls back to black and white for unknown platforms', () => {
      expect(getPlatformTooltipTheme(UNKNOWN)).toEqual({
        bg: 'black',
        text: 'white'
      });
    });
  });
});
