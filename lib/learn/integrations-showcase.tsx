'use client';

import { SupportedIntegrations } from '@/lib/home/supported-integrations';
import type { ResolvedTheme } from '@/lib/theme/get-server-theme';
import type { PlatformId } from '@/lib/platform-icons';

const ALL_PLATFORM_IDS: PlatformId[] = [
  'x',
  'bluesky',
  'discord',
  'youtube',
  'twitch',
  'tiktok',
  'reddit',
  'spotify',
  'instagram',
  'facebook',
  'steam',
  'linkedin',
  'github',
  'patreon',
  'producthunt',
  'coinbase',
  'kick',
  'snapchat',
  'threads',
  'pinterest',
  'tumblr',
  'google'
];

interface IntegrationsShowcaseProps {
  initialTheme: ResolvedTheme;
}

export function IntegrationsShowcase({
  initialTheme
}: IntegrationsShowcaseProps) {
  return (
    <div className="space-y-12">
      <SupportedIntegrations
        initialTheme={initialTheme}
        platformIds={ALL_PLATFORM_IDS}
        showSeeAllButton={false}
      />
    </div>
  );
}
