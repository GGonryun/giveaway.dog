import { notFound } from 'next/navigation';
import { IntegrationLandingPage } from '@/lib/integrations/integration-landing-page';
import { PlatformId } from '@giveaway/platform-catalog/platform-icons';

interface IntegrationPageProps {
  params: Promise<{
    platform: string;
  }>;
}

const PLATFORM_NAMES: Record<PlatformId, string> = {
  x: 'X (Twitter)',
  bluesky: 'Bluesky',
  discord: 'Discord',
  youtube: 'YouTube',
  twitch: 'Twitch',
  tiktok: 'TikTok',
  reddit: 'Reddit',
  spotify: 'Spotify',
  instagram: 'Instagram',
  facebook: 'Facebook',
  steam: 'Steam',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  patreon: 'Patreon',
  producthunt: 'Product Hunt',
  coinbase: 'Coinbase',
  kick: 'Kick',
  snapchat: 'Snapchat',
  threads: 'Threads',
  pinterest: 'Pinterest',
  tumblr: 'Tumblr',
  velora: 'Velora',
  google: 'Google'
};

const VALID_PLATFORMS = Object.keys(PLATFORM_NAMES);

export default async function IntegrationPage({
  params
}: IntegrationPageProps) {
  const { platform } = await params;

  if (!VALID_PLATFORMS.includes(platform)) {
    notFound();
  }

  const platformId = platform as PlatformId;
  const platformName = PLATFORM_NAMES[platformId];

  return (
    <IntegrationLandingPage platform={platformId} platformName={platformName} />
  );
}
