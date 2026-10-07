'use client';

import Image from 'next/image';
import { cn } from '@giveaway/ui-utils/utils';
import { Button } from '@giveaway/ui-primitives/button';
import {
  getPlatformIcon,
  getPlatformLabel,
  type PlatformId
} from '@giveaway/platform-catalog/platform-icons';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import type { ResolvedTheme } from '@giveaway/theme-server/get-server-theme';
import Link from 'next/link';

const GOLDEN_ANGLE = 137.5;

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

const INNER_RING_PLATFORMS: PlatformId[] = [
  'x',
  'instagram',
  'twitch',
  'discord',
  'bluesky',
  'reddit',
  'youtube',
  'tiktok'
];

const MIDDLE_RING_PLATFORMS: PlatformId[] = [
  'facebook',
  'linkedin',
  'github',
  'steam',
  'spotify',
  'patreon',
  'google'
];

const OUTER_RING_PLATFORMS: PlatformId[] = [
  'kick',
  'snapchat',
  'threads',
  'pinterest',
  'tumblr',
  'coinbase',
  'producthunt',
  'x'
];

interface OrbitingPlatformsProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  centerImage?: string;
  showCenterLogo?: boolean;
  initialTheme: ResolvedTheme;
}

interface OrbitRingProps {
  platforms: PlatformId[];
  radius: number;
  iconSize: number;
  animation: 'orbit-cw' | 'orbit-ccw';
  duration: number;
  initialTheme: ResolvedTheme;
}

const OrbitRing = ({
  platforms,
  radius,
  iconSize,
  animation,
  duration,
  initialTheme
}: OrbitRingProps) => {
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
      {platforms.map((platformId, index) => {
        const angle = (360 / platforms.length) * index;
        const iconRotation = Math.floor(index * GOLDEN_ANGLE + radius) % 360;
        const iconSrc = getPlatformIcon(platformId, theme);
        const label = getPlatformLabel(platformId);
        return (
          <div
            key={`${platformId}-${index}`}
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
                transform: `rotate(${iconRotation}deg)`
              }}
            >
              <Image
                src={iconSrc}
                alt={label}
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
  showCenterLogo = true,
  initialTheme
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
          initialTheme={initialTheme}
        />

        <OrbitRing
          platforms={MIDDLE_RING_PLATFORMS}
          radius={preset.middle}
          iconSize={preset.icon}
          animation="orbit-ccw"
          duration={60}
          initialTheme={initialTheme}
        />

        <OrbitRing
          platforms={OUTER_RING_PLATFORMS}
          radius={preset.outer}
          iconSize={preset.icon}
          animation="orbit-cw"
          duration={80}
          initialTheme={initialTheme}
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

interface OrbitingPlatformsSectionProps {
  initialTheme: ResolvedTheme;
}

export const OrbitingPlatformsSection = ({
  initialTheme
}: OrbitingPlatformsSectionProps) => {
  return (
    <div className="w-full flex items-center justify-center">
      <div className="bg-background relative h-120 w-full rounded-3xl max-w-lg border border-border/40 overflow-hidden flex flex-col shadow-xl">
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <div className="absolute -top-14 left-1/2 -translate-x-1/2">
            <OrbitingPlatforms
              size="lg"
              showCenterLogo={false}
              initialTheme={initialTheme}
            />
          </div>

          {/* Manually positioned Taki logo - stays above gradient */}
          <div className="absolute left-1/2 top-46 -translate-x-1/2 z-15">
            <div className="rounded-full border-2 border-border bg-background shadow-xl flex items-center justify-center w-18 h-18 opacity-75">
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
          <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none z-10 bg-linear-to-t from-background/95 via-background/60 to-transparent" />
        </div>

        <div className="relative px-8 py-6 backdrop-blur-sm shrink-0 space-y-2 bg-card">
          <h3 className="text-lg font-semibold text-foreground">
            100+ entry methods
          </h3>
          <p className="text-muted-foreground text-sm">
            Build engagement with your audience across multiple platforms with a
            variety of entry methods. Create a seamless experience for your
            participants.
          </p>
        </div>
      </div>
    </div>
  );
};
