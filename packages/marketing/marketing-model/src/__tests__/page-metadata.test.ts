import { describe, expect, it } from 'vitest';
import { DEFAULT_PREVIEW_IMAGE, pageMetadata } from '../page-metadata';

describe('pageMetadata', () => {
  it('gives the page its title, description and the default preview image', () => {
    expect(
      pageMetadata({ title: 'Pricing | Giveaway.dog', description: 'Plans' })
    ).toEqual({
      title: 'Pricing | Giveaway.dog',
      description: 'Plans',
      openGraph: {
        title: 'Pricing | Giveaway.dog',
        description: 'Plans',
        type: 'website',
        images: [
          {
            url: '/api/og',
            width: 1200,
            height: 630,
            alt: 'Pricing | Giveaway.dog'
          }
        ]
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Pricing | Giveaway.dog',
        description: 'Plans',
        images: ['/api/og']
      }
    });
  });

  it('uses the given preview image in Open Graph and Twitter', () => {
    const metadata = pageMetadata({
      title: 'Browse',
      description: 'Giveaways',
      image: '/api/og/browse'
    });

    expect(metadata.openGraph?.images).toEqual([
      { url: '/api/og/browse', width: 1200, height: 630, alt: 'Browse' }
    ]);
    expect(metadata.twitter?.images).toEqual(['/api/og/browse']);
  });

  it('defaults to the root preview image', () => {
    expect(DEFAULT_PREVIEW_IMAGE).toBe('/api/og');
  });
});
