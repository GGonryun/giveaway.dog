import { describe, expect, it } from 'vitest';
import { twitterOEmbedResponseSchema } from '../schemas';

const embed = {
  url: 'https://twitter.com/acme_dog/status/1234567890',
  author_name: 'Acme Dog',
  author_url: 'https://twitter.com/acme_dog',
  html: '<blockquote class="twitter-tweet">hello</blockquote>'
};

describe('twitterOEmbedResponseSchema', () => {
  it('keeps the fields that the app reads', () => {
    expect(
      twitterOEmbedResponseSchema.parse({
        ...embed,
        width: 550,
        version: '1.0'
      })
    ).toEqual(embed);
  });

  it('refuses a response without the html of the embed', () => {
    const { html, ...rest } = embed;
    expect(twitterOEmbedResponseSchema.safeParse(rest).success).toBe(false);
  });
});
