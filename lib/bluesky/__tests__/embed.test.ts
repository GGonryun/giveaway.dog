import { describe, it, expect } from 'vitest';
import { BLUESKY_EMBED_SCRIPT_URL } from '../embed';

describe('BLUESKY_EMBED_SCRIPT_URL', () => {
  it('points at the official bluesky embed script', () => {
    expect(BLUESKY_EMBED_SCRIPT_URL).toBe(
      'https://embed.bsky.app/static/embed.js'
    );
  });

  it('is served over https', () => {
    expect(new URL(BLUESKY_EMBED_SCRIPT_URL).protocol).toBe('https:');
  });
});
