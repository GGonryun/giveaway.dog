import { notFound } from 'next/navigation';
import { IntegrationLandingPage } from '@giveaway/marketing-learn/integration-landing-page';
import { PlatformId } from '@giveaway/platform-catalog/platform-icons';
import { pageMetadata } from '@giveaway/marketing-model/page-metadata';

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

const isPlatformId = (platform: string): platform is PlatformId =>
  VALID_PLATFORMS.includes(platform);

export async function generateMetadata({ params }: IntegrationPageProps) {
  const { platform } = await params;

  if (!isPlatformId(platform)) {
    return {};
  }

  const platformName = PLATFORM_NAMES[platform];

  return pageMetadata({
    title: `${platformName} Giveaways | Giveaway.dog`,
    description: `Run giveaways with ${platformName} entry methods on Giveaway.dog, and grow your ${platformName} audience with every entry.`
  });
}

export default async function IntegrationPage({
  params
}: IntegrationPageProps) {
  const { platform } = await params;

  if (!isPlatformId(platform)) {
    notFound();
  }

  return (
    <IntegrationLandingPage
      platform={platform}
      platformName={PLATFORM_NAMES[platform]}
    />
  );
}
