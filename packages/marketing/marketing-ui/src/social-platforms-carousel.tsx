'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@giveaway/ui-primitives/tooltip';
import { cn } from '@giveaway/ui-utils/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem
} from '@giveaway/ui-carousel/carousel';
import AutoScroll from 'embla-carousel-auto-scroll';
import {
  getPlatformIcon,
  getPlatformLabel,
  getPlatformTooltipTheme,
  CAROUSEL_PLATFORMS
} from '@giveaway/platform-catalog/platform-icons';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import type { ResolvedTheme } from '@giveaway/theme-server/get-server-theme';

interface SocialPlatformsCarouselProps {
  initialTheme: ResolvedTheme;
}

export const SocialPlatformsCarousel = ({
  initialTheme
}: SocialPlatformsCarouselProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use initialTheme from server on first render, then switch to client theme
  const themeValue =
    mounted && (resolvedTheme === 'dark' || resolvedTheme === 'light')
      ? resolvedTheme
      : initialTheme;

  return (
    <div className="w-full relative">
      <Carousel
        opts={{
          align: 'start',
          loop: true,
          dragFree: true
        }}
        plugins={[
          AutoScroll({
            speed: 1,
            stopOnInteraction: false,
            stopOnMouseEnter: false
          })
        ]}
        className="w-full"
      >
        <CarouselContent className="ml-0 mr-0">
          {CAROUSEL_PLATFORMS.concat(CAROUSEL_PLATFORMS).map(
            (platformId, index) => {
              const iconSrc = getPlatformIcon(platformId, themeValue);
              const platformLabel = getPlatformLabel(platformId);
              const tooltipTheme = getPlatformTooltipTheme(platformId);

              return (
                <CarouselItem
                  key={`${platformId}-${index}`}
                  className="basis-auto py-1 pl-4 sm:pl-4 md:pl-6 lg:pl-8"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/learn/integrations/${platformId}`}
                        className="cursor-pointer opacity-80 w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex items-center justify-center hover:opacity-100"
                      >
                        <Image
                          src={iconSrc}
                          alt={platformLabel}
                          height={48}
                          width={48}
                          sizes="32px, 40px, 48px"
                        />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent
                      className={cn(
                        'font-semibold',
                        'bg-reddit-1 fill-reddit-1',
                        `bg-${tooltipTheme.bg}`,
                        `text-${tooltipTheme.text}`,
                        `fill-${tooltipTheme.bg}`
                      )}
                      arrowClassName={cn(
                        `bg-${tooltipTheme.bg}`,
                        `text-${tooltipTheme.text}`,
                        `fill-${tooltipTheme.bg}`
                      )}
                    >
                      {platformLabel}
                    </TooltipContent>
                  </Tooltip>
                </CarouselItem>
              );
            }
          )}
        </CarouselContent>
      </Carousel>
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  );
};
