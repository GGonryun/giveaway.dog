'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  getPlatformIcon,
  getPlatformLabel,
  type PlatformId
} from '@giveaway/platform-catalog/platform-icons';
import type { ResolvedTheme } from '@giveaway/theme-server/get-server-theme';

const PLATFORM_BADGES: Partial<
  Record<
    PlatformId,
    { label: string; badgeClassName: string; borderClassName: string }
  >
> = {
  discord: {
    label: 'Popular',
    badgeClassName: 'bg-discord-1 text-white',
    borderClassName: 'border-discord-1'
  },
  reddit: {
    label: 'New',
    badgeClassName: 'bg-reddit-1 text-white',
    borderClassName: 'border-reddit-1'
  },
  twitch: {
    label: 'Trending',
    badgeClassName: 'bg-twitch-1 text-white',
    borderClassName: 'border-twitch-1'
  }
};

const DEFAULT_PLATFORM_IDS: PlatformId[] = [
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
  'steam'
];

interface SupportedIntegrationsProps {
  initialTheme: ResolvedTheme;
  platformIds?: PlatformId[];
  showSeeAllButton?: boolean;
}

export const SupportedIntegrations = ({
  initialTheme,
  platformIds = DEFAULT_PLATFORM_IDS,
  showSeeAllButton = true
}: SupportedIntegrationsProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme =
    mounted && (resolvedTheme === 'dark' || resolvedTheme === 'light')
      ? resolvedTheme
      : initialTheme;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6 mx-auto w-full">
      {platformIds.map((platformId) => {
        const badge = PLATFORM_BADGES[platformId] ?? null;
        return (
          <div key={platformId} className="relative">
            {badge && (
              <span
                className={`wiggle-timer absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${badge.badgeClassName}`}
              >
                {badge.label}
              </span>
            )}
            <a
              href={`/learn/integrations/${platformId}`}
              className={`group relative rounded-xl transition-all duration-300 cursor-pointer block bg-card hover:bg-card/80 border hover:shadow-lg ${badge ? badge.borderClassName : 'border-border hover:border-foreground/20'}`}
            >
              <div className="relative flex flex-col items-center text-center p-5 h-full">
                <div className="w-16 h-16 relative mb-1 transition-transform duration-300 group-hover:scale-110">
                  <Image
                    alt={getPlatformLabel(platformId)}
                    src={getPlatformIcon(platformId, theme)}
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <h3 className="text-sm font-medium">
                  {getPlatformLabel(platformId)}
                </h3>
              </div>
            </a>
          </div>
        );
      })}

      {showSeeAllButton && (
        <div className="relative">
          <span className="wiggle-timer absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap bg-muted-foreground text-background">
            20+
          </span>
          <a
            href="/learn/integrations"
            className="group bg-card hover:bg-card/80 border border-muted-foreground/30 hover:border-foreground/20 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer block"
          >
            <div className="flex flex-col items-center text-center p-5">
              <div className="w-16 h-16 flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-12 h-12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="5" cy="12" r="2" fill="currentColor" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                  <circle cx="19" cy="12" r="2" fill="currentColor" />
                </svg>
              </div>
              <h3 className="text-sm font-medium">See all platforms</h3>
            </div>
          </a>
        </div>
      )}
    </div>
  );
};
