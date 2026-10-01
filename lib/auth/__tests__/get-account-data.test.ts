import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAccountLabel, getAccountLink } from '../get-account-data';

const account = (provider: string, providerAccountId?: string) => ({
  provider,
  providerAccountId
});

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getAccountLabel', () => {
  describe.each(['google', 'email'])('for the %s provider', (provider) => {
    it('returns the profile email', () => {
      expect(
        getAccountLabel(account(provider), { email: 'a@example.com' })
      ).toBe('a@example.com');
    });

    it('returns null when the profile has no email', () => {
      expect(getAccountLabel(account(provider), { name: 'A' })).toBeNull();
    });

    it('returns null when the profile is undefined', () => {
      expect(getAccountLabel(account(provider), undefined)).toBeNull();
    });
  });

  describe('for the discord provider', () => {
    const full = {
      username: 'user',
      global_name: 'Global',
      name: 'Name',
      email: 'd@example.com'
    };

    it('prefers the username', () => {
      expect(getAccountLabel(account('discord'), full)).toBe('user');
    });

    it('falls back to the global name', () => {
      expect(
        getAccountLabel(account('discord'), { ...full, username: '' })
      ).toBe('Global');
    });

    it('falls back to the name', () => {
      expect(
        getAccountLabel(account('discord'), {
          name: 'Name',
          email: 'd@example.com'
        })
      ).toBe('Name');
    });

    it('falls back to the email', () => {
      expect(
        getAccountLabel(account('discord'), { email: 'd@example.com' })
      ).toBe('d@example.com');
    });

    it('returns null when no identifying field exists', () => {
      expect(getAccountLabel(account('discord'), {})).toBeNull();
    });

    it('returns null when the profile is undefined', () => {
      expect(getAccountLabel(account('discord'), undefined)).toBeNull();
    });
  });

  describe('for the twitter provider', () => {
    it('returns the username', () => {
      expect(getAccountLabel(account('twitter'), { username: 'jack' })).toBe(
        'jack'
      );
    });

    it('returns null when the username is empty', () => {
      expect(
        getAccountLabel(account('twitter'), { username: '', name: 'Jack' })
      ).toBeNull();
    });

    it('returns null when the profile is undefined', () => {
      expect(getAccountLabel(account('twitter'), undefined)).toBeNull();
    });
  });

  describe.each(['steam', 'twitch'])('for the %s provider', (provider) => {
    it('returns the profile name', () => {
      expect(getAccountLabel(account(provider), { name: 'Gamer' })).toBe(
        'Gamer'
      );
    });

    it('returns null when the profile has no name', () => {
      expect(
        getAccountLabel(account(provider), { username: 'gamer' })
      ).toBeNull();
    });
  });

  describe('for the kick provider', () => {
    it('prefers the username', () => {
      expect(
        getAccountLabel(account('kick'), { username: 'kicker', name: 'K' })
      ).toBe('kicker');
    });

    it('falls back to the name', () => {
      expect(getAccountLabel(account('kick'), { name: 'K' })).toBe('K');
    });

    it('returns null when no field exists', () => {
      expect(getAccountLabel(account('kick'), {})).toBeNull();
    });
  });

  describe.each(['tiktok', 'velora'])('for the %s provider', (provider) => {
    it('prefers the username', () => {
      expect(
        getAccountLabel(account(provider), {
          username: 'u',
          display_name: 'D',
          name: 'N'
        })
      ).toBe('u');
    });

    it('falls back to the display name', () => {
      expect(
        getAccountLabel(account(provider), { display_name: 'D', name: 'N' })
      ).toBe('D');
    });

    it('falls back to the name', () => {
      expect(getAccountLabel(account(provider), { name: 'N' })).toBe('N');
    });

    it('returns null when no field exists', () => {
      expect(getAccountLabel(account(provider), undefined)).toBeNull();
    });
  });

  describe('for the bluesky provider', () => {
    it('returns the handle', () => {
      expect(
        getAccountLabel(account('bluesky'), { handle: 'me.bsky.social' })
      ).toBe('me.bsky.social');
    });

    it('returns null when the handle is missing', () => {
      expect(getAccountLabel(account('bluesky'), { name: 'Me' })).toBeNull();
    });
  });

  describe('for the linkedin provider', () => {
    it('returns the last path segment of the user profile url', () => {
      expect(
        getAccountLabel(
          account('linkedin'),
          { name: 'Jane' },
          { linkedInProfileUrl: 'https://www.linkedin.com/in/jane-doe/' }
        )
      ).toBe('jane-doe');
    });

    it('falls back to the profile name when the url has no path segments', () => {
      expect(
        getAccountLabel(
          account('linkedin'),
          { name: 'Jane', email: 'j@example.com' },
          { linkedInProfileUrl: 'https://www.linkedin.com/' }
        )
      ).toBe('Jane');
    });

    it('falls back to the profile name when the user has no profile url', () => {
      expect(getAccountLabel(account('linkedin'), { name: 'Jane' }, {})).toBe(
        'Jane'
      );
    });

    it('falls back to the profile email when there is no name', () => {
      expect(
        getAccountLabel(account('linkedin'), { email: 'j@example.com' })
      ).toBe('j@example.com');
    });

    it('returns null when nothing identifying exists', () => {
      expect(getAccountLabel(account('linkedin'), undefined)).toBeNull();
    });

    it('throws when the user profile url is not a valid url', () => {
      expect(() =>
        getAccountLabel(
          account('linkedin'),
          { name: 'Jane' },
          { linkedInProfileUrl: 'not a url' }
        )
      ).toThrow(TypeError);
    });
  });

  it('returns null for an unknown provider', () => {
    expect(
      getAccountLabel(account('myspace'), {
        username: 'tom',
        name: 'Tom',
        email: 't@example.com'
      })
    ).toBeNull();
  });
});

describe('getAccountLink', () => {
  describe('for the twitter provider', () => {
    it('links to the x.com profile', () => {
      expect(getAccountLink(account('twitter'), { username: 'jack' })).toBe(
        'https://x.com/jack'
      );
    });

    it('strips a leading at sign from the username', () => {
      expect(getAccountLink(account('twitter'), { username: '@jack' })).toBe(
        'https://x.com/jack'
      );
    });

    it('returns null without a username', () => {
      expect(getAccountLink(account('twitter'), {})).toBeNull();
    });
  });

  describe('for the twitch provider', () => {
    it('links to the lowercased twitch channel', () => {
      expect(getAccountLink(account('twitch'), { name: 'StreamerX' })).toBe(
        'https://www.twitch.tv/streamerx'
      );
    });

    it('returns null without a name', () => {
      expect(getAccountLink(account('twitch'), {})).toBeNull();
    });
  });

  describe('for the steam provider', () => {
    it('links to the steam community profile by account id', () => {
      expect(
        getAccountLink(account('steam', '76561198000000000'), { name: 'G' })
      ).toBe('https://steamcommunity.com/profiles/76561198000000000');
    });

    it('returns null without a provider account id', () => {
      expect(getAccountLink(account('steam'), { name: 'G' })).toBeNull();
    });
  });

  describe('for the kick provider', () => {
    it('links to the lowercased kick channel', () => {
      expect(getAccountLink(account('kick'), { username: 'Kicker' })).toBe(
        'https://kick.com/kicker'
      );
    });

    it('returns null without a label', () => {
      expect(getAccountLink(account('kick'), {})).toBeNull();
    });
  });

  describe('for the discord provider', () => {
    it('links to the discord user by account id', () => {
      expect(getAccountLink(account('discord', '1234'), {})).toBe(
        'https://discord.com/users/1234'
      );
    });

    it('returns null without a provider account id', () => {
      expect(
        getAccountLink(account('discord'), { username: 'user' })
      ).toBeNull();
    });
  });

  describe('for the google provider', () => {
    it('returns a mailto link for the email', () => {
      expect(
        getAccountLink(account('google'), { email: 'g@example.com' })
      ).toBe('mailto:g@example.com');
    });

    it('returns null without an email', () => {
      expect(getAccountLink(account('google'), {})).toBeNull();
    });
  });

  describe('for the tiktok provider', () => {
    it('returns the profile deep link', () => {
      expect(
        getAccountLink(account('tiktok'), {
          username: 'tt',
          profile_deep_link: 'https://www.tiktok.com/@tt'
        })
      ).toBe('https://www.tiktok.com/@tt');
    });

    it('returns null without a deep link', () => {
      expect(getAccountLink(account('tiktok'), { username: 'tt' })).toBeNull();
    });

    it('returns null when the profile is undefined', () => {
      expect(getAccountLink(account('tiktok'), undefined)).toBeNull();
    });
  });

  describe('for the bluesky provider', () => {
    it('links to the bsky.app profile', () => {
      expect(
        getAccountLink(account('bluesky'), { handle: 'me.bsky.social' })
      ).toBe('https://bsky.app/profile/me.bsky.social');
    });

    it('returns null without a handle', () => {
      expect(getAccountLink(account('bluesky'), {})).toBeNull();
    });
  });

  describe('for the velora provider', () => {
    it('links to the velora channel without lowercasing', () => {
      expect(getAccountLink(account('velora'), { username: 'VeloUser' })).toBe(
        'https://velora.tv/VeloUser'
      );
    });

    it('returns null without a label', () => {
      expect(getAccountLink(account('velora'), {})).toBeNull();
    });
  });

  describe('for the linkedin provider', () => {
    it('returns the user profile url', () => {
      expect(
        getAccountLink(
          account('linkedin'),
          { name: 'Jane' },
          { linkedInProfileUrl: 'https://www.linkedin.com/in/jane' }
        )
      ).toBe('https://www.linkedin.com/in/jane');
    });

    it('returns null when the user has no profile url', () => {
      expect(getAccountLink(account('linkedin'), { name: 'Jane' })).toBeNull();
    });
  });

  it('returns null for the email provider', () => {
    expect(getAccountLink(account('email'), { email: 'e@example.com' })).toBe(
      null
    );
  });

  it('returns null for an unknown provider', () => {
    expect(
      getAccountLink(account('myspace', 'id-1'), { username: 'tom' })
    ).toBeNull();
  });

  it('logs the account and profile used to build the link', () => {
    const acc = account('twitter');
    const profile = { username: 'jack' };

    getAccountLink(acc, profile);

    expect(console.info).toHaveBeenCalledWith(
      'Generating account link for provider:',
      acc,
      profile
    );
  });
});
