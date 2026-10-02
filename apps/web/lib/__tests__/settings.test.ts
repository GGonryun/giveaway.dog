import { describe, it, expect } from 'vitest';
import { IdentityProvider } from '@prisma/client';
import * as settings from '../settings';
import { isAccountTab } from '@/schemas/account';
import { isSweepstakesTab } from '@/schemas/sweepstakes';
import { isUserDetailsTab } from '@/schemas/user';

describe('settings', () => {
  describe('limits and thresholds', () => {
    it('defines team, sweepstakes and paging limits', () => {
      expect({
        MAX_USER_TEAMS: settings.MAX_USER_TEAMS,
        NEW_SWEEPSTAKE_THRESHOLD: settings.NEW_SWEEPSTAKE_THRESHOLD,
        ENDING_SOON_SWEEPSTAKE_THRESHOLD:
          settings.ENDING_SOON_SWEEPSTAKE_THRESHOLD,
        STARTING_SOON_SWEEPSTAKE_THRESHOLD:
          settings.STARTING_SOON_SWEEPSTAKE_THRESHOLD,
        DEFAULT_TIME_SERIES_DURATION: settings.DEFAULT_TIME_SERIES_DURATION,
        DEFAULT_PAGE_SIZE: settings.DEFAULT_PAGE_SIZE,
        MAX_SWEEPSTAKE_DURATION_DAYS: settings.MAX_SWEEPSTAKE_DURATION_DAYS,
        MAX_PICKER_SCHEDULE_DAYS: settings.MAX_PICKER_SCHEDULE_DAYS,
        MAX_TWITTER_V2_PICKER_POSTS: settings.MAX_TWITTER_V2_PICKER_POSTS
      }).toEqual({
        MAX_USER_TEAMS: 5,
        NEW_SWEEPSTAKE_THRESHOLD: 3,
        ENDING_SOON_SWEEPSTAKE_THRESHOLD: 3,
        STARTING_SOON_SWEEPSTAKE_THRESHOLD: 1,
        DEFAULT_TIME_SERIES_DURATION: 7,
        DEFAULT_PAGE_SIZE: 10,
        MAX_SWEEPSTAKE_DURATION_DAYS: 90,
        MAX_PICKER_SCHEDULE_DAYS: 14,
        MAX_TWITTER_V2_PICKER_POSTS: 5
      });
    });
  });

  describe('unknown value placeholders', () => {
    it('defines fallbacks for unknown visitor details', () => {
      expect({
        UNKNOWN_USER_COUNTRY_CODE: settings.UNKNOWN_USER_COUNTRY_CODE,
        UNKNOWN_USER_AGENT: settings.UNKNOWN_USER_AGENT,
        UNKNOWN_OS: settings.UNKNOWN_OS,
        UNKNOWN_BROWSER: settings.UNKNOWN_BROWSER,
        UNKNOWN_EMAIL: settings.UNKNOWN_EMAIL,
        UNKNOWN_ACCEPTED_LANGUAGE: settings.UNKNOWN_ACCEPTED_LANGUAGE,
        UNKNOWN_IP: settings.UNKNOWN_IP,
        UNKNOWN_TIMEZONE: settings.UNKNOWN_TIMEZONE,
        UNKNOWN_SCREEN: settings.UNKNOWN_SCREEN,
        UNKNOWN_USER_NAME: settings.UNKNOWN_USER_NAME
      }).toEqual({
        UNKNOWN_USER_COUNTRY_CODE: 'XX',
        UNKNOWN_USER_AGENT: 'unknown',
        UNKNOWN_OS: 'Unknown OS',
        UNKNOWN_BROWSER: 'Unknown Browser',
        UNKNOWN_EMAIL: 'no email',
        UNKNOWN_ACCEPTED_LANGUAGE: 'en',
        UNKNOWN_IP: '::1',
        UNKNOWN_TIMEZONE: 'UTC',
        UNKNOWN_SCREEN: '0x0',
        UNKNOWN_USER_NAME: 'Anonymous'
      });
    });
  });

  describe('default tabs', () => {
    it('defaults sweepstakes details to the preview tab', () => {
      expect(settings.DEFAULT_SWEEPSTAKES_DETAILS_TAB).toBe('preview');
      expect(isSweepstakesTab(settings.DEFAULT_SWEEPSTAKES_DETAILS_TAB)).toBe(
        true
      );
    });

    it('defaults user details to the overview tab', () => {
      expect(settings.DEFAULT_USER_DETAILS_TAB).toBe('overview');
      expect(isUserDetailsTab(settings.DEFAULT_USER_DETAILS_TAB)).toBe(true);
    });

    it('defaults the account page to the profile tab', () => {
      expect(settings.DEFAULT_ACCOUNT_TAB).toBe('profile');
      expect(isAccountTab(settings.DEFAULT_ACCOUNT_TAB)).toBe(true);
    });
  });

  describe('entry defaults', () => {
    it('allows eight identity providers by default in order', () => {
      expect(settings.DEFAULT_ALLOWED_IDENTITIES).toEqual([
        IdentityProvider.TWITTER,
        IdentityProvider.GOOGLE,
        IdentityProvider.DISCORD,
        IdentityProvider.EMAIL,
        IdentityProvider.TWITCH,
        IdentityProvider.KICK,
        IdentityProvider.TIKTOK,
        IdentityProvider.STEAM
      ]);
    });

    it('does not allow anonymous or bluesky identities by default', () => {
      expect(settings.DEFAULT_ALLOWED_IDENTITIES).not.toContain(
        IdentityProvider.ANONYMOUS
      );
      expect(settings.DEFAULT_ALLOWED_IDENTITIES).not.toContain(
        IdentityProvider.BLUESKY
      );
    });

    it('does not require login before entry by default', () => {
      expect(settings.DEFAULT_REQUIRED_PRE_ENTRY_LOGIN).toBe(false);
    });
  });

  describe('external links', () => {
    it('defines the social and promotional urls', () => {
      expect({
        VISIT_URL: settings.VISIT_URL,
        DISCORD_INVITE_LINK: settings.DISCORD_INVITE_LINK,
        DISCORD_PUBLIC_CHANNEL_URL: settings.DISCORD_PUBLIC_CHANNEL_URL,
        TWITTER_PROFILE_URL: settings.TWITTER_PROFILE_URL,
        TWITTER_POST_URL: settings.TWITTER_POST_URL,
        STEAM_APP_ID_URL: settings.STEAM_APP_ID_URL,
        TWITCH_CHANNEL_URL: settings.TWITCH_CHANNEL_URL,
        KICK_CHANNEL_URL: settings.KICK_CHANNEL_URL,
        YOUTUBE_CHANNEL_URL: settings.YOUTUBE_CHANNEL_URL,
        INSTAGRAM_PROFILE_URL: settings.INSTAGRAM_PROFILE_URL,
        FACEBOOK_PROFILE_URL: settings.FACEBOOK_PROFILE_URL,
        FACEBOOK_POST_URL: settings.FACEBOOK_POST_URL,
        TIKTOK_PROFILE_URL: settings.TIKTOK_PROFILE_URL,
        BLUESKY_PROFILE_URL: settings.BLUESKY_PROFILE_URL,
        VELORA_CHANNEL_URL: settings.VELORA_CHANNEL_URL,
        LINKEDIN_PROFILE_URL: settings.LINKEDIN_PROFILE_URL
      }).toEqual({
        VISIT_URL: 'https://charity.games',
        DISCORD_INVITE_LINK: 'https://discord.gg/Ys8wW5w2Yt',
        DISCORD_PUBLIC_CHANNEL_URL:
          'https://discord.com/channels/1425715950988034130/1425715951906590732',
        TWITTER_PROFILE_URL: 'https://x.com/TheGiveawayDog',
        TWITTER_POST_URL:
          'https://x.com/TheGiveawayDog/status/1948654500698619966',
        STEAM_APP_ID_URL:
          'https://store.steampowered.com/app/2457870/Sandys_Great_Escape/',
        TWITCH_CHANNEL_URL: 'https://www.twitch.tv/ggonryun',
        KICK_CHANNEL_URL: 'https://www.kick.com/ggonryun',
        YOUTUBE_CHANNEL_URL: 'https://www.youtube.com/@gonryun',
        INSTAGRAM_PROFILE_URL: 'https://www.instagram.com/charitydotgames/',
        FACEBOOK_PROFILE_URL:
          'https://www.facebook.com/people/Giveaway-Dog/61584646297782/',
        FACEBOOK_POST_URL:
          'https://www.facebook.com/permalink.php?story_fbid=122099278905154876&id=61584646297782&ref=embed_post',
        TIKTOK_PROFILE_URL: 'https://www.tiktok.com/@giveawaydog',
        BLUESKY_PROFILE_URL: 'https://bsky.app/profile/giveawaydog.bsky.social',
        VELORA_CHANNEL_URL: 'https://velora.tv/gonryun',
        LINKEDIN_PROFILE_URL: 'https://www.linkedin.com/company/giveaway-dog'
      });
    });

    it('uses parseable https urls for every link', () => {
      const urls = Object.entries(settings)
        .filter(([name]) => /_(URL|LINK)$/.test(name))
        .map(([, value]) => String(value));

      expect(urls).toHaveLength(16);
      for (const url of urls) {
        expect(new URL(url).protocol).toBe('https:');
      }
    });

    it('defines the YouTube channel name and id', () => {
      expect(settings.YOUTUBE_CHANNEL_NAME).toBe('GiveawayDog');
      expect(settings.YOUTUBE_CHANNEL_ID).toBe('UCbTcSd0aoM0A0sxxz8TBD6w');
    });
  });
});
