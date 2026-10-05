import { describe, it, expect } from 'vitest';
import { toProviderUrl } from '../to-provider-url';

describe('toProviderUrl', () => {
  describe('for TWITTER integrations', () => {
    it('returns the x.com profile url for the label', () => {
      expect(toProviderUrl({ provider: 'TWITTER', label: 'giveawaydog' })).toBe(
        'https://x.com/giveawaydog'
      );
    });

    it('returns null when the label is null', () => {
      expect(toProviderUrl({ provider: 'TWITTER', label: null })).toBeNull();
    });

    it('returns null when the label is an empty string', () => {
      expect(toProviderUrl({ provider: 'TWITTER', label: '' })).toBeNull();
    });

    it('inserts the label into the url without encoding it', () => {
      expect(toProviderUrl({ provider: 'TWITTER', label: 'a b/c' })).toBe(
        'https://x.com/a b/c'
      );
    });
  });

  describe('for BLUESKY integrations', () => {
    it('returns the bsky.app profile url for the label', () => {
      expect(
        toProviderUrl({ provider: 'BLUESKY', label: 'giveaway.bsky.social' })
      ).toBe('https://bsky.app/profile/giveaway.bsky.social');
    });

    it('returns null when the label is null', () => {
      expect(toProviderUrl({ provider: 'BLUESKY', label: null })).toBeNull();
    });

    it('returns null when the label is an empty string', () => {
      expect(toProviderUrl({ provider: 'BLUESKY', label: '' })).toBeNull();
    });
  });

  describe('for other providers', () => {
    it.each(['DISCORD', 'TWITCH', 'twitter', 'bluesky', ''])(
      'returns null for provider %j even with a label',
      (provider) => {
        expect(toProviderUrl({ provider, label: 'someone' })).toBeNull();
      }
    );
  });
});
