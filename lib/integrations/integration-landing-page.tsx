'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlatformId, PLATFORM_ICONS } from '@/lib/platform-icons';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';

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
            <div className="relative w-24 h-24 rounded-2x border-2 border-border shadow-lg flex items-center justify-center">
              <img
                src={iconSrc}
                alt={platformName}
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>

          <MarketingPageHeader
            title={
              <>
                Create giveaways with{' '}
                <span className="text-primary">{platformName}</span>
              </>
            }
            description={`Save time and grow your ${platformName} presence by scheduling your giveaways in advance. Automate your growth with verifiable entries and bot detection.`}
          />

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button asChild size="lg" className="gap-2 text-lg px-8">
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
