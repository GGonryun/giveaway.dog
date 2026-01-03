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
import { useEffect, useRef, useState } from 'react';

const PLATFORMS = [
  {
    name: 'Twitter/X',
    icon: '/platforms/x.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Bluesky',
    icon: '/platforms/bluesky.svg',
    theme: {
      bg: 'bluesky-1',
      text: 'white'
    }
  },
  {
    name: 'Twitch',
    icon: '/platforms/twitch.svg',
    theme: {
      bg: 'twitch-1',
      text: 'white'
    }
  },
  {
    name: 'TikTok',
    icon: '/platforms/tiktok.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Kick',
    icon: '/platforms/kick.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Facebook',
    icon: '/platforms/facebook.svg',
    theme: {
      bg: 'facebook-1',
      text: 'white'
    }
  },
  {
    name: 'Snapchat',
    icon: '/platforms/snapchat.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Threads',
    icon: '/platforms/threads.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'LinkedIn',
    icon: '/platforms/linkedin.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Pinterest',
    icon: '/platforms/Pinterest.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Reddit',
    icon: '/platforms/reddit.svg',
    theme: {
      bg: 'reddit-1',
      text: 'white'
    }
  },
  {
    name: 'Instagram',
    icon: '/platforms/instagram.svg',
    theme: {
      bg: 'instagram-1',
      text: 'white'
    }
  },
  {
    name: 'YouTube',
    icon: '/platforms/youtube.svg',
    theme: {
      bg: 'youtube-1',
      text: 'white'
    }
  },
  {
    name: 'Discord',
    icon: '/platforms/discord.svg',
    theme: {
      bg: 'discord-1',
      text: 'white'
    }
  },
  {
    name: 'Tumblr',
    icon: '/platforms/tumblr.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Github',
    icon: '/platforms/github.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Google',
    icon: '/platforms/google.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Patreon',
    icon: '/platforms/patreon.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Product Hunt',
    icon: '/platforms/producthunt.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Coinbase',
    icon: '/platforms/coinbase.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Spotify',
    icon: '/platforms/spotify.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  },
  {
    name: 'Steam',
    icon: '/platforms/steam.svg',
    theme: {
      bg: 'black',
      text: 'white'
    }
  }
];

export const SocialPlatformsCarousel = () => {
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
          {PLATFORMS.concat(PLATFORMS).map((platform, index) => (
            <CarouselItem
              key={`${platform.name}-${index}`}
              className="basis-auto py-1 pl-4 sm:pl-4 md:pl-6 lg:pl-8"
            >
              <Tooltip>
                <TooltipTrigger className="cursor-pointer opacity-80 w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex items-center justify-center hover:opacity-100">
                  <Image
                    src={platform.icon}
                    alt={platform.name}
                    height={48}
                    width={48}
                    sizes="32px, 40px, 48px"
                  />
                </TooltipTrigger>
                <TooltipContent
                  className={cn(
                    'font-semibold',
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
          ))}
        </CarouselContent>
      </Carousel>
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  );
};
