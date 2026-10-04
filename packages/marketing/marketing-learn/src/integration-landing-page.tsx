'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@giveaway/ui-primitives/button';
import {
  PlatformId,
  PLATFORM_ICONS,
  PLATFORM_TOOLTIP_THEMES
} from '@giveaway/platform-catalog/platform-icons';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { MarketingPageHeader } from '@giveaway/marketing-ui/marketing/marketing-page-header';
import { cn } from '@giveaway/ui-utils/utils';

interface IntegrationLandingPageProps {
  platform: PlatformId;
  platformName: string;
}

export function IntegrationLandingPage({
  platform,
  platformName
}: IntegrationLandingPageProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? resolvedTheme || theme : 'light';
  const platformIcon = PLATFORM_ICONS[platform];
  const iconSrc =
    currentTheme === 'dark' && platformIcon.dark
      ? platformIcon.dark
      : platformIcon.light;

  return (
    <div className="my-auto mx-auto flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Platform Icon */}
          <div className="flex justify-center mb-8">
            <img
              src={iconSrc}
              alt={platformName}
              className="size-40 sm:size-48 md:size-56 lg:size-64 object-contain"
            />
          </div>

          <MarketingPageHeader
            title={
              <>
                Create giveaways with{' '}
                <span
                  className={cn(
                    `bg-${PLATFORM_TOOLTIP_THEMES[platform].bg} text-${PLATFORM_TOOLTIP_THEMES[platform].text} px-2 rounded-md`
                  )}
                >
                  {platformName}
                </span>
              </>
            }
            description={`Save time and grow your ${platformName} presence by scheduling your giveaways in advance. Automate your growth with verifiable entries and bot detection.`}
          />

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              asChild
              size="lg"
              className={cn(
                'gap-2 text-lg px-8',
                `bg-${PLATFORM_TOOLTIP_THEMES[platform].bg} text-${PLATFORM_TOOLTIP_THEMES[platform].text} hover:bg-${PLATFORM_TOOLTIP_THEMES[platform].bg} hover:text-${PLATFORM_TOOLTIP_THEMES[platform].text}`
              )}
            >
              <Link href="/login">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8"
            >
              <Link href="/browse">Browse Giveaways</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
