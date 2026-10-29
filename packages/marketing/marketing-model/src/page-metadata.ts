import type { Metadata } from 'next';

export const DEFAULT_PREVIEW_IMAGE = '/api/og';

type PageMetadataOptions = {
  title: string;
  description: string;
  image?: string;
};

export const pageMetadata = ({
  title,
  description,
  image = DEFAULT_PREVIEW_IMAGE
}: PageMetadataOptions): Metadata => ({
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
    images: [{ url: image, width: 1200, height: 630, alt: title }]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [image]
  }
});
