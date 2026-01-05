'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const SIZE_PRESETS = {
  sm: {
    container: 400,
    inner: 80,
    middle: 120,
    outer: 160,
    icon: 20,
    center: 56
  },
  md: {
    container: 500,
    inner: 100,
    middle: 150,
    outer: 200,
    icon: 24,
    center: 64
  },
  lg: {
    container: 600,
    inner: 120,
    middle: 180,
    outer: 240,
    icon: 28,
    center: 72
  }
} as const;

interface Platform {
  name: string;
  icon: string;
}

const INNER_RING_PLATFORMS: Platform[] = [
  { name: 'Twitter/X', icon: '/platforms/x.svg' },
  { name: 'Instagram', icon: '/platforms/instagram.svg' },
  { name: 'Twitch', icon: '/platforms/twitch.svg' },
  { name: 'Discord', icon: '/platforms/discord.svg' },
  { name: 'Bluesky', icon: '/platforms/bluesky.svg' },
  { name: 'Reddit', icon: '/platforms/reddit.svg' },
  { name: 'YouTube', icon: '/platforms/youtube.svg' },
  { name: 'TikTok', icon: '/platforms/tiktok.svg' }
];

const MIDDLE_RING_PLATFORMS: Platform[] = [
  { name: 'Facebook', icon: '/platforms/facebook.svg' },
  { name: 'LinkedIn', icon: '/platforms/linkedin.svg' },
  { name: 'GitHub', icon: '/platforms/github.svg' },
  { name: 'Steam', icon: '/platforms/steam.svg' },
  { name: 'Spotify', icon: '/platforms/spotify.svg' },
  { name: 'Patreon', icon: '/platforms/patreon.svg' },
  { name: 'Google', icon: '/platforms/google.svg' }
];

const OUTER_RING_PLATFORMS: Platform[] = [
  { name: 'Kick', icon: '/platforms/kick.svg' },
  { name: 'Snapchat', icon: '/platforms/snapchat.svg' },
  { name: 'Threads', icon: '/platforms/threads.svg' },
  { name: 'Pinterest', icon: '/platforms/pinterest.svg' },
  { name: 'Tumblr', icon: '/platforms/tumblr.svg' },
  { name: 'Coinbase', icon: '/platforms/coinbase.svg' },
  { name: 'Product Hunt', icon: '/platforms/producthunt.svg' },
  { name: 'Twitter', icon: '/platforms/x.svg' }
];

interface OrbitingPlatformsProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  centerImage?: string;
  showCenterLogo?: boolean;
}

interface OrbitRingProps {
  platforms: Platform[];
  radius: number;
  iconSize: number;
  animation: 'orbit-cw' | 'orbit-ccw';
  duration: number;
}

const OrbitRing = ({
  platforms,
  radius,
  iconSize,
  animation,
  duration
}: OrbitRingProps) => {
  return (
    <div
      className="absolute rounded-full border-2 border-border/40 pointer-events-none"
      style={{
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        animation: `${animation} ${duration}s linear infinite`
      }}
    >
      {platforms.map((platform, index) => {
        const angle = (360 / platforms.length) * index;
        const randomRotation = Math.floor(Math.random() * 360);
        return (
          <div
            key={`${platform.name}-${index}`}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              transform: `rotate(${angle}deg) translate(${radius}px, -50%) rotate(-${angle}deg)`
            }}
          >
            <div
              className={cn(
                'transition-all duration-300 hover:scale-110',
                'flex items-center justify-center pointer-events-auto'
              )}
              style={{
                width: `${iconSize}px`,
                height: `${iconSize}px`,
                marginLeft: `-${iconSize / 2}px`,
                marginTop: `-${iconSize / 2}px`,
                transform: `rotate(${randomRotation}deg)`
              }}
            >
              <Image
                src={platform.icon}
                alt={platform.name}
                width={iconSize}
                height={iconSize}
                className="object-contain"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const OrbitingPlatforms = ({
  className,
  size = 'md',
  centerImage = '/taki.png',
  showCenterLogo = true
}: OrbitingPlatformsProps) => {
  const preset = SIZE_PRESETS[size];

  return (
    <>
      <style>{`
        @keyframes orbit-cw {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes orbit-ccw {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(-360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0s !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div
        className={cn('relative', className)}
        style={{
          width: `${preset.container}px`,
          height: `${preset.container}px`,
          aspectRatio: '1'
        }}
        aria-label="Platform integrations visualization with orbiting logos"
      >
        <OrbitRing
          platforms={INNER_RING_PLATFORMS}
          radius={preset.inner}
          iconSize={preset.icon}
          animation="orbit-cw"
          duration={52}
        />

        <OrbitRing
          platforms={MIDDLE_RING_PLATFORMS}
          radius={preset.middle}
          iconSize={preset.icon}
          animation="orbit-ccw"
          duration={60}
        />

        <OrbitRing
          platforms={OUTER_RING_PLATFORMS}
          radius={preset.outer}
          iconSize={preset.icon}
          animation="orbit-cw"
          duration={80}
        />

        {showCenterLogo && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div
              className="rounded-full border-2 border-border bg-background shadow-xl flex items-center justify-center"
              style={{
                width: `${preset.center}px`,
                height: `${preset.center}px`
              }}
            >
              <Image
                src={centerImage}
                alt="Giveaway Dog"
                width={preset.center - 32}
                height={preset.center - 32}
                className="object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export const OrbitingPlatformsSection = () => {
  return (
    <div className="w-full flex items-center justify-center">
      <div className="relative h-[480px] w-full rounded-3xl max-w-lg border border-border/40 overflow-hidden flex flex-col shadow-xl">
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2">
            <OrbitingPlatforms size="lg" showCenterLogo={false} />
          </div>

          {/* Manually positioned Taki logo - stays above gradient */}
          <div className="absolute left-1/2 top-36 -translate-x-1/2 z-15">
            <div className="rounded-full border-2 border-border bg-background shadow-xl flex items-center justify-center w-[72px] h-[72px] opacity-75">
              <Image
                src="/taki.png"
                alt="Giveaway Dog"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
          </div>

          {/* Bottom fade gradient - creates soft transition where animation meets text */}
          <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none z-10 bg-gradient-to-t from-background/95 via-background/60 to-transparent" />
        </div>

        <div className="relative px-8 py-6 backdrop-blur-sm flex-shrink-0 space-y-2 bg-card">
          <h3 className="text-lg font-semibold text-foreground">
            100+ entry methods
          </h3>
          <p className="text-muted-foreground text-sm">
            Build engagement with your audience across multiple platforms with a
            variety of entry methods. Create a seamless experience for your
            participants.
          </p>
          <Button
            variant="outline"
            className="-ml-1 mt-2"
            onClick={() => alert('Coming soon!')}
          >
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
};
