import { describe, it, expect } from 'vitest';
import { listChannelSnippetSchema } from '../youtube';

const snippet = () => ({
  title: 'Dog Channel',
  description: 'All about dogs',
  customUrl: '@dogchannel',
  publishedAt: '2020-01-01T00:00:00Z',
  thumbnails: {
    default: { url: 'https://yt3.ggpht.com/default.jpg' }
  }
});

describe('listChannelSnippetSchema', () => {
  describe('when the snippet is valid', () => {
    it('returns the snippet unchanged', () => {
      expect(listChannelSnippetSchema.parse(snippet())).toEqual(snippet());
    });

    it('allows the custom url to be omitted', () => {
      const input: Record<string, unknown> = snippet();
      delete input.customUrl;

      const parsed = listChannelSnippetSchema.parse(input);

      expect(parsed).toEqual(input);
      expect(parsed).not.toHaveProperty('customUrl');
    });

    it('keeps publishedAt as a string without coercing it to a date', () => {
      expect(listChannelSnippetSchema.parse(snippet()).publishedAt).toBe(
        '2020-01-01T00:00:00Z'
      );
    });

    it('drops thumbnail sizes other than default', () => {
      const parsed = listChannelSnippetSchema.parse({
        ...snippet(),
        thumbnails: {
          default: { url: 'https://a/default.jpg', width: 88 },
          high: { url: 'https://a/high.jpg' }
        }
      });

      expect(parsed.thumbnails).toEqual({
        default: { url: 'https://a/default.jpg' }
      });
    });
  });

  describe('when the snippet is invalid', () => {
    it.each(['title', 'description', 'publishedAt', 'thumbnails'])(
      'rejects a snippet without %s',
      (field) => {
        const input: Record<string, unknown> = snippet();
        delete input[field];

        const result = listChannelSnippetSchema.safeParse(input);

        expect(result.error?.issues[0].path).toEqual([field]);
      }
    );

    it('rejects a snippet without a default thumbnail', () => {
      const result = listChannelSnippetSchema.safeParse({
        ...snippet(),
        thumbnails: {}
      });

      expect(result.error?.issues[0].path).toEqual(['thumbnails', 'default']);
    });

    it('rejects a default thumbnail without a url', () => {
      const result = listChannelSnippetSchema.safeParse({
        ...snippet(),
        thumbnails: { default: {} }
      });

      expect(result.error?.issues[0].path).toEqual([
        'thumbnails',
        'default',
        'url'
      ]);
    });

    it('rejects a null custom url', () => {
      expect(
        listChannelSnippetSchema.safeParse({ ...snippet(), customUrl: null })
          .success
      ).toBe(false);
    });
  });
});
