import { describe, it, expect } from 'vitest';
import {
  extractInstagramUsername,
  instagramLoginFormSchema,
  instagramProfileUrlSchema,
  normalizeInstagramUrl
} from '../instagram';

const INVALID_MESSAGE =
  'Must be a valid Instagram profile URL (e.g., https://instagram.com/username)';

const messagesFor = (input: unknown) => {
  const result = instagramProfileUrlSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe('instagramProfileUrlSchema', () => {
  describe('when the url is a valid profile url', () => {
    it.each([
      'https://instagram.com/user_name',
      'https://www.instagram.com/user.name/',
      'http://instagram.com/user',
      'instagram.com/user',
      'www.instagram.com/User123',
      'HTTPS://INSTAGRAM.COM/USER',
      '  https://instagram.com/user  '
    ])('accepts %s', (url) => {
      expect(instagramProfileUrlSchema.safeParse(url).success).toBe(true);
    });

    it('returns the original untrimmed value', () => {
      expect(instagramProfileUrlSchema.parse(' instagram.com/Me ')).toBe(
        ' instagram.com/Me '
      );
    });
  });

  describe('when the url is not a valid profile url', () => {
    it('reports both the required and format messages for an empty string', () => {
      expect(messagesFor('')).toEqual([
        'Instagram profile URL is required',
        INVALID_MESSAGE
      ]);
    });

    it('reports only the format message for a single character', () => {
      expect(messagesFor('a')).toEqual([INVALID_MESSAGE]);
    });

    it.each([
      'https://instagram.com/',
      'https://instagram.com/p/abc123',
      'https://instagram.com/reel/abc123/',
      'https://instagram.com/stories/user/1',
      'https://instagr.am/user',
      'https://instagram.com/user-name',
      'https://instagram.com/user?igshid=abc',
      'https://m.instagram.com/user',
      'ftp://instagram.com/user'
    ])('rejects %s', (url) => {
      expect(messagesFor(url)).toEqual([INVALID_MESSAGE]);
    });

    it('rejects a non-string value', () => {
      expect(instagramProfileUrlSchema.safeParse(null).success).toBe(false);
    });
  });
});

describe('instagramLoginFormSchema', () => {
  it('parses an object with a valid profile url', () => {
    expect(
      instagramLoginFormSchema.parse({
        instagramProfileUrl: 'https://instagram.com/user'
      })
    ).toEqual({ instagramProfileUrl: 'https://instagram.com/user' });
  });

  it('rejects an object with a post url', () => {
    const result = instagramLoginFormSchema.safeParse({
      instagramProfileUrl: 'https://instagram.com/p/abc'
    });

    expect(result.error?.issues.map((i) => i.message)).toEqual([
      INVALID_MESSAGE
    ]);
  });

  it('rejects an object missing the profile url', () => {
    expect(instagramLoginFormSchema.safeParse({}).success).toBe(false);
  });
});

describe('extractInstagramUsername', () => {
  it('returns the lowercased username', () => {
    expect(
      extractInstagramUsername('https://www.Instagram.com/User.Name/')
    ).toBe('user.name');
  });

  it('keeps underscores in the username', () => {
    expect(extractInstagramUsername('instagram.com/the_user')).toBe('the_user');
  });

  it('returns the first path segment of a post url', () => {
    expect(extractInstagramUsername('https://instagram.com/p/abc')).toBe('p');
  });

  it('returns the original url unchanged when nothing matches', () => {
    expect(extractInstagramUsername('https://Example.com/User')).toBe(
      'https://Example.com/User'
    );
  });
});

describe('normalizeInstagramUrl', () => {
  it('normalizes to lowercase https without www or trailing slash', () => {
    expect(normalizeInstagramUrl('http://www.Instagram.com/User/')).toBe(
      'https://instagram.com/user'
    );
  });

  it('appends the raw input when it is not an instagram url', () => {
    expect(normalizeInstagramUrl('Someone')).toBe(
      'https://instagram.com/Someone'
    );
  });
});
