'use client';

import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem
} from '@/components/ui/carousel';
import AutoScroll from 'embla-carousel-auto-scroll';
import { getPlatformIcon, type PlatformId } from '@/lib/platform-icons';

const PLATFORMS = [
  {
    name: 'Twitter/X',
    id: 'x' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Bluesky',
    id: 'bluesky' as PlatformId,
    theme: {
      bg: 'bluesky-1',
      text: 'white'
    }
  },
  {
    name: 'Twitch',
    id: 'twitch' as PlatformId,
    theme: {
      bg: 'twitch-1',
      text: 'white'
    }
  },
  {
    name: 'TikTok',
    id: 'tiktok' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Kick',
    id: 'kick' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Facebook',
    id: 'facebook' as PlatformId,
    theme: {
      bg: 'facebook-1',
      text: 'white'
    }
  },
  {
    name: 'Snapchat',
    id: 'snapchat' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Threads',
    id: 'threads' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'LinkedIn',
    id: 'linkedin' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Pinterest',
    id: 'pinterest' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Reddit',
    id: 'reddit' as PlatformId,
    theme: {
      bg: 'reddit-1',
      text: 'white'
    }
  },
  {
    name: 'Instagram',
    id: 'instagram' as PlatformId,
    theme: {
      bg: 'instagram-1',
      text: 'white'
    }
  },
  {
    name: 'YouTube',
    id: 'youtube' as PlatformId,
    theme: {
      bg: 'youtube-1',
      text: 'white'
    }
  },
  {
    name: 'Discord',
    id: 'discord' as PlatformId,
    theme: {
      bg: 'discord-1',
      text: 'white'
    }
  },
  {
    name: 'Tumblr',
    id: 'tumblr' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Github',
    id: 'github' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Google',
    id: 'google' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Patreon',
    id: 'patreon' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Product Hunt',
    id: 'producthunt' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Coinbase',
    id: 'coinbase' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Spotify',
    id: 'spotify' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Steam',
    id: 'steam' as PlatformId,
    theme: {
      bg: 'black',
      text: 'white'
    }
  }
];

interface SocialPlatformsCarouselProps {
  theme: 'light' | 'dark';
}

export const SocialPlatformsCarousel = ({
  theme
}: SocialPlatformsCarouselProps) => {
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
          {PLATFORMS.concat(PLATFORMS).map((platform, index) => {
            const iconSrc = getPlatformIcon(platform.id, theme);

            return (
              <CarouselItem
                key={`${platform.name}-${index}`}
                className="basis-auto py-1 pl-4 sm:pl-4 md:pl-6 lg:pl-8"
              >
                <Tooltip>
                  <TooltipTrigger className="cursor-pointer opacity-80 w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex items-center justify-center hover:opacity-100">
                    <Image
                      src={iconSrc}
                      alt={platform.name}
                      height={48}
                      width={48}
                      sizes="32px, 40px, 48px"
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    className={cn(
                      'font-semibold',
                      'bg-reddit-1 fill-reddit-1', // todo remove when this gets used else where
                      `bg-${platform.theme.bg}`,
                      `text-${platform.theme.text}`,
                      `fill-${platform.theme.bg}`
                    )}
                    arrowClassName={cn(
                      `bg-${platform.theme.bg}`,
                      `text-${platform.theme.text}`,
                      `fill-${platform.theme.bg}`
                    )}
                  >
                    {platform.name}
                  </TooltipContent>
                </Tooltip>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  );
};
