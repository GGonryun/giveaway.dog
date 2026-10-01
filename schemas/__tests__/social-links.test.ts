import { describe, it, expect } from 'vitest';
import type { JsonValue } from '@prisma/client/runtime/library';
import {
  SUPPORTED_SOCIAL_PLATFORMS,
  socialLinkSchema,
  socialLinksSchema,
  PLATFORM_LABELS,
  PLATFORM_PLACEHOLDERS,
  parseSocialLinks
} from '../social-links';

describe('SUPPORTED_SOCIAL_PLATFORMS', () => {
  it('lists the ten supported platforms in order', () => {
    expect(SUPPORTED_SOCIAL_PLATFORMS).toEqual([
      'x',
      'facebook',
      'instagram',
      'discord',
      'reddit',
      'youtube',
      'twitch',
      'tiktok',
      'linkedin',
      'website'
    ]);
  });
});

describe('socialLinkSchema', () => {
  it('accepts a supported platform with a URL', () => {
    const link = { platform: 'x', url: 'https://x.com/dog' };

    expect(socialLinkSchema.parse(link)).toEqual(link);
  });

  it('rejects an unsupported platform', () => {
    const result = socialLinkSchema.safeParse({
      platform: 'myspace',
      url: 'https://myspace.com/dog'
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['platform']);
  });

  it('rejects an invalid URL with a friendly message', () => {
    const result = socialLinkSchema.safeParse({
      platform: 'website',
      url: 'example.com'
    });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Must be a valid URL'
    ]);
  });
});

describe('socialLinksSchema', () => {
  it('accepts an empty list', () => {
    expect(socialLinksSchema.parse([])).toEqual([]);
  });

  it('rejects a non-array', () => {
    expect(socialLinksSchema.safeParse({}).success).toBe(false);
  });
});

describe('platform records', () => {
  it('labels every platform', () => {
    expect(PLATFORM_LABELS).toEqual({
      x: 'X (Twitter)',
      facebook: 'Facebook',
      instagram: 'Instagram',
      discord: 'Discord',
      reddit: 'Reddit',
      youtube: 'YouTube',
      twitch: 'Twitch',
      tiktok: 'TikTok',
      linkedin: 'LinkedIn',
      website: 'Website'
    });
  });

  it('provides a placeholder for every platform that is itself a valid link', () => {
    expect(Object.keys(PLATFORM_PLACEHOLDERS)).toEqual([
      ...SUPPORTED_SOCIAL_PLATFORMS
    ]);
    for (const [platform, url] of Object.entries(PLATFORM_PLACEHOLDERS)) {
      expect(socialLinkSchema.safeParse({ platform, url }).success).toBe(true);
    }
  });

  it('uses the expected placeholder URLs', () => {
    expect(PLATFORM_PLACEHOLDERS).toEqual({
      x: 'https://x.com/username',
      facebook: 'https://facebook.com/username',
      instagram: 'https://instagram.com/username',
      discord: 'https://discord.gg/invite',
      reddit: 'https://reddit.com/r/subreddit',
      youtube: 'https://youtube.com/@channel',
      twitch: 'https://twitch.tv/channel',
      tiktok: 'https://tiktok.com/@username',
      linkedin: 'https://linkedin.com/company/name',
      website: 'https://example.com'
    });
  });
});

describe('parseSocialLinks', () => {
  it.each([null, '', 0, false])('returns an empty list for %j', (value) => {
    expect(parseSocialLinks(value)).toEqual([]);
  });

  it('returns the links when the data is valid', () => {
    const links = [
      { platform: 'discord', url: 'https://discord.gg/abc' },
      { platform: 'youtube', url: 'https://youtube.com/@dog' }
    ];

    expect(parseSocialLinks(links)).toEqual(links);
  });

  it('strips unknown keys from each link', () => {
    expect(
      parseSocialLinks([
        { platform: 'x', url: 'https://x.com/dog', handle: '@dog' }
      ])
    ).toEqual([{ platform: 'x', url: 'https://x.com/dog' }]);
  });

  it('returns an empty list when any link is invalid', () => {
    expect(
      parseSocialLinks([
        { platform: 'x', url: 'https://x.com/dog' },
        { platform: 'x', url: 'not a url' }
      ])
    ).toEqual([]);
  });

  it('returns an empty list for a non-array object', () => {
    expect(
      parseSocialLinks({ platform: 'x', url: 'https://x.com/dog' })
    ).toEqual([]);
  });

  it('returns an empty list when reading the data throws', () => {
    const exploding = [
      {
        get platform(): string {
          throw new Error('boom');
        },
        url: 'https://x.com/dog'
      }
    ];

    expect(parseSocialLinks(exploding as unknown as JsonValue)).toEqual([]);
  });
});
