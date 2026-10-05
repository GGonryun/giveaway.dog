import { describe, it, expect } from 'vitest';
import {
  extractFacebookIdentifier,
  facebookLoginFormSchema,
  facebookProfileUrlSchema,
  normalizeFacebookUrl
} from '../facebook';

const INVALID_MESSAGE = 'Must be a valid Facebook profile URL';

const messagesFor = (input: unknown) => {
  const result = facebookProfileUrlSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe('facebookProfileUrlSchema', () => {
  describe('when the url is a valid profile url', () => {
    it.each([
      'https://facebook.com/john.doe',
      'https://www.facebook.com/john.doe/',
      'http://facebook.com/johndoe',
      'facebook.com/johndoe',
      'www.facebook.com/JohnDoe123',
      'HTTPS://WWW.FACEBOOK.COM/JOHNDOE',
      '  https://facebook.com/johndoe  ',
      'https://facebook.com/profile.php?id=123456789',
      'facebook.com/profile.php?id=1'
    ])('accepts %s', (url) => {
      expect(facebookProfileUrlSchema.safeParse(url).success).toBe(true);
    });

    it('returns the original untrimmed value', () => {
      expect(facebookProfileUrlSchema.parse(' facebook.com/John ')).toBe(
        ' facebook.com/John '
      );
    });
  });

  describe('when the url is not a valid profile url', () => {
    it('reports both the required and format messages for an empty string', () => {
      expect(messagesFor('')).toEqual([
        'Facebook profile URL is required',
        INVALID_MESSAGE
      ]);
    });

    it('reports only the format message for a single character', () => {
      expect(messagesFor('a')).toEqual([INVALID_MESSAGE]);
    });

    it.each([
      'https://facebook.com/',
      'https://facebook.com/groups/123',
      'https://m.facebook.com/johndoe',
      'https://fb.com/johndoe',
      'https://facebook.com/john_doe',
      'https://facebook.com/john-doe',
      'https://facebook.com/profile.php?id=abc',
      'https://facebook.com/profile.php?id=123/',
      'https://facebook.com/johndoe?ref=bookmarks',
      'ftp://facebook.com/johndoe',
      'https://notfacebook.com/johndoe'
    ])('rejects %s', (url) => {
      expect(messagesFor(url)).toEqual([INVALID_MESSAGE]);
    });

    it('rejects a non-string value', () => {
      expect(facebookProfileUrlSchema.safeParse(123).success).toBe(false);
    });
  });
});

describe('facebookLoginFormSchema', () => {
  it('parses an object with a valid profile url', () => {
    expect(
      facebookLoginFormSchema.parse({
        facebookProfileUrl: 'https://facebook.com/johndoe'
      })
    ).toEqual({ facebookProfileUrl: 'https://facebook.com/johndoe' });
  });

  it('rejects an object with an invalid profile url', () => {
    const result = facebookLoginFormSchema.safeParse({
      facebookProfileUrl: 'https://fb.com/johndoe'
    });

    expect(result.error?.issues.map((i) => i.message)).toEqual([
      INVALID_MESSAGE
    ]);
  });

  it('rejects an object missing the profile url', () => {
    expect(facebookLoginFormSchema.safeParse({}).success).toBe(false);
  });
});

describe('extractFacebookIdentifier', () => {
  it('returns the numeric id for an id-based url', () => {
    expect(
      extractFacebookIdentifier('https://facebook.com/profile.php?id=123456')
    ).toBe('123456');
  });

  it('returns the lowercased username for a username url', () => {
    expect(
      extractFacebookIdentifier('https://www.facebook.com/John.Doe/')
    ).toBe('john.doe');
  });

  it('stops the username at the first unsupported character', () => {
    expect(
      extractFacebookIdentifier('https://facebook.com/john_doe?ref=x')
    ).toBe('john');
  });

  it('trims surrounding whitespace before matching', () => {
    expect(extractFacebookIdentifier('  facebook.com/Jane  ')).toBe('jane');
  });

  it('returns the original url unchanged when nothing matches', () => {
    expect(extractFacebookIdentifier('https://Example.com/Path')).toBe(
      'https://Example.com/Path'
    );
  });
});

describe('normalizeFacebookUrl', () => {
  it('normalizes an id-based url to the canonical profile.php form', () => {
    expect(
      normalizeFacebookUrl('http://www.facebook.com/profile.php?id=987')
    ).toBe('https://facebook.com/profile.php?id=987');
  });

  it('normalizes a username url to lowercase https without www', () => {
    expect(normalizeFacebookUrl('www.Facebook.com/John.Doe/')).toBe(
      'https://facebook.com/john.doe'
    );
  });

  it('appends the raw input when it is not a facebook url', () => {
    expect(normalizeFacebookUrl('Not A Url')).toBe(
      'https://facebook.com/Not A Url'
    );
  });
});
