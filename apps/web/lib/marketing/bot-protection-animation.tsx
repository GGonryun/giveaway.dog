'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZE_PRESETS = {
  sm: {
    container: 400,
    radius: 120,
    icon: 20,
    center: 80,
    orbSize: 6
  },
  md: {
    container: 500,
    radius: 150,
    icon: 24,
    center: 100,
    orbSize: 8
  },
  lg: {
    container: 600,
    radius: 180,
    icon: 28,
    center: 120,
    orbSize: 10
  }
} as const;

interface Platform {
  name: string;
  icon: string;
}

const PLATFORMS: Platform[] = [
  { name: 'Twitter/X', icon: '/platforms/x.svg' },
  { name: 'Instagram', icon: '/platforms/instagram.svg' },
  { name: 'Twitch', icon: '/platforms/twitch.svg' },
  { name: 'Discord', icon: '/platforms/discord.svg' },
  { name: 'Bluesky', icon: '/platforms/bluesky.svg' },
  { name: 'Reddit', icon: '/platforms/reddit.svg' },
  { name: 'YouTube', icon: '/platforms/youtube.svg' },
  { name: 'TikTok', icon: '/platforms/tiktok.svg' }
];

const ACCOUNTS_PER_PLATFORM = 3;
const TOTAL_ACCOUNTS = PLATFORMS.length * ACCOUNTS_PER_PLATFORM;

interface BotProtectionAnimationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  autoPlay?: boolean;
}

type AnimationPhase = 'idle' | 'running';

interface AccountState {
  active: boolean;
  progress: number;
  isBot: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  bouncing: boolean;
  bounceProgress: number;
}

export const BotProtectionAnimation = ({
  className,
  size = 'md',
  autoPlay = true
}: BotProtectionAnimationProps) => {
  const preset = SIZE_PRESETS[size];
  const containerRef = useRef<HTMLDivElement>(null);
  const accountStatesRef = useRef<AccountState[]>([]);
  const animationFramesRef = useRef<number[]>([]);
  const isRunningRef = useRef(false);

  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [shieldPulse, setShieldPulse] = useState(false);
  const [activePlatform, setActivePlatform] = useState<number | null>(null);
  const [, setTick] = useState(0);

  const forceUpdate = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  const calculateAccountPath = useCallback(
    (platformIndex: number) => {
      const angle = (360 / PLATFORMS.length) * platformIndex;
      const radians = (angle * Math.PI) / 180;

      const startX = preset.container / 2 + Math.cos(radians) * preset.radius;
      const startY = preset.container / 2 + Math.sin(radians) * preset.radius;
      const endX = preset.container / 2;
      const endY = preset.container / 2;

      return { startX, startY, endX, endY };
    },
    [preset]
  );

  const initializeAccountPool = useCallback(() => {
    if (accountStatesRef.current.length === 0) {
      accountStatesRef.current = Array.from({ length: TOTAL_ACCOUNTS }, () => ({
        active: false,
        progress: 0,
        isBot: false,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        bouncing: false,
        bounceProgress: 0
      }));
    }
  }, []);

  const animateAccount = useCallback(
    (index: number) => {
      const duration = 2500;
      const startTime = Date.now();
      const shieldRadius = preset.center * 0.65;
      const account = accountStatesRef.current[index];

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        account.progress = easedProgress;

        const currentX =
          account.startX + (account.endX - account.startX) * easedProgress;
        const currentY =
          account.startY + (account.endY - account.startY) * easedProgress;
        const distanceFromCenter = Math.sqrt(
          Math.pow(currentX - preset.container / 2, 2) +
            Math.pow(currentY - preset.container / 2, 2)
        );

        if (
          account.isBot &&
          distanceFromCenter <= shieldRadius &&
          !account.bouncing
        ) {
          setShieldPulse(true);
          setTimeout(() => setShieldPulse(false), 300);

          account.bouncing = true;
          const bounceStartTime = Date.now();
          const bounceDuration = 800;

          const bounceAnimate = () => {
            const bounceElapsed = Date.now() - bounceStartTime;
            const bounceProgress = Math.min(bounceElapsed / bounceDuration, 1);
            account.bounceProgress = bounceProgress;

            if (bounceProgress < 1) {
              forceUpdate();
              animationFramesRef.current[index] =
                requestAnimationFrame(bounceAnimate);
            } else {
              account.active = false;
              forceUpdate();
            }
          };
          animationFramesRef.current[index] =
            requestAnimationFrame(bounceAnimate);
          return;
        }

        forceUpdate();

        if (progress < 1) {
          animationFramesRef.current[index] = requestAnimationFrame(animate);
        } else {
          if (!account.isBot) {
            account.active = false;
            forceUpdate();
          }
        }
      };

      animationFramesRef.current[index] = requestAnimationFrame(animate);
    },
    [preset, forceUpdate]
  );

  const launchSingleAccount = useCallback(
    (accountIndex: number, platformIndex: number) => {
      const path = calculateAccountPath(platformIndex);
      const isBot = Math.random() < 0.4;

      const account = accountStatesRef.current[accountIndex];
      account.active = true;
      account.progress = 0;
      account.isBot = isBot;
      account.bouncing = false;
      account.bounceProgress = 0;
      account.startX = path.startX;
      account.startY = path.startY;
      account.endX = path.endX;
      account.endY = path.endY;

      setActivePlatform(platformIndex);
      setTimeout(() => setActivePlatform(null), 300);

      animateAccount(accountIndex);
      forceUpdate();
    },
    [calculateAccountPath, animateAccount, forceUpdate]
  );

  const launchAccounts = useCallback(() => {
    setPhase('running');
    isRunningRef.current = true;

    const launchNext = () => {
      if (!isRunningRef.current) return;

      const platformIndex = Math.floor(Math.random() * PLATFORMS.length);
      const availableIndex = accountStatesRef.current.findIndex(
        (acc) => !acc.active
      );

      if (availableIndex !== -1) {
        launchSingleAccount(availableIndex, platformIndex);
      }

      const nextDelay = 400 + Math.random() * 200;
      setTimeout(launchNext, nextDelay);
    };

    launchNext();
  }, [launchSingleAccount]);

  const startAnimation = useCallback(() => {
    initializeAccountPool();
    setPhase('running');

    animationFramesRef.current.forEach((frame) => {
      if (frame) cancelAnimationFrame(frame);
    });
    animationFramesRef.current = [];

    accountStatesRef.current.forEach((account) => {
      account.active = false;
    });

    setTimeout(() => {
      launchAccounts();
    }, 100);
  }, [launchAccounts, initializeAccountPool]);

  useEffect(() => {
    if (autoPlay && phase === 'idle') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (!mediaQuery.matches) {
        startAnimation();
      }
    }
  }, [autoPlay, phase, startAnimation]);

  useEffect(() => {
    return () => {
      animationFramesRef.current.forEach((frame) => {
        if (frame) cancelAnimationFrame(frame);
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      style={{
        width: `${preset.container}px`,
        height: `${preset.container}px`,
        aspectRatio: '1'
      }}
      aria-label="Bot protection animation showing Giveaway Dog blocking fake accounts"
      role="img"
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        {accountStatesRef.current.map((account, index) => {
          if (!account.active) return null;

          let currentX, currentY;

          if (account.bouncing) {
            const bounceBackProgress = Math.sin(
              account.bounceProgress * Math.PI
            );
            const retreatDistance = preset.radius * 0.3;
            const dx = account.startX - account.endX;
            const dy = account.startY - account.endY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const normalX = dx / length;
            const normalY = dy / length;

            currentX =
              account.startX +
              (account.endX - account.startX) * account.progress +
              normalX * retreatDistance * bounceBackProgress;
            currentY =
              account.startY +
              (account.endY - account.startY) * account.progress +
              normalY * retreatDistance * bounceBackProgress;
          } else {
            currentX =
              account.startX +
              (account.endX - account.startX) * account.progress;
            currentY =
              account.startY +
              (account.endY - account.startY) * account.progress;
          }

          let opacity = 1;
          if (account.bouncing) {
            opacity = Math.max(0, 1 - account.bounceProgress);
          } else if (!account.isBot && account.progress > 0.85) {
            opacity = Math.max(0, 1 - (account.progress - 0.85) / 0.15);
          }

          return (
            <g key={index}>
              <motion.circle
                cx={currentX}
                cy={currentY}
                r={preset.orbSize}
                fill={
                  account.isBot
                    ? 'rgba(239, 68, 68, 0.8)'
                    : 'rgba(34, 197, 94, 0.8)'
                }
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity,
                  scale: account.bouncing ? [1, 1.3, 0.8] : 1
                }}
                transition={{ duration: 0.2 }}
              />
              <text
                x={currentX}
                y={currentY + 1}
                fontSize={preset.orbSize * 0.8}
                fill="white"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ pointerEvents: 'none', userSelect: 'none', opacity }}
              >
                {account.isBot ? '✕' : '✓'}
              </text>
            </g>
          );
        })}
      </svg>

      {PLATFORMS.map((platform, index) => {
        const angle = (360 / PLATFORMS.length) * index;
        const radians = (angle * Math.PI) / 180;
        const x =
          preset.container / 2 +
          Math.cos(radians) * preset.radius -
          preset.icon / 2;
        const y =
          preset.container / 2 +
          Math.sin(radians) * preset.radius -
          preset.icon / 2;
        const isActive = activePlatform === index;

        return (
          <motion.div
            key={platform.name}
            className="absolute flex items-center justify-center"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${preset.icon}px`,
              height: `${preset.icon}px`,
              opacity: 1
            }}
            animate={{
              scale: isActive ? [1, 1.3, 1] : 1
            }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src={platform.icon}
              alt={platform.name}
              width={preset.icon}
              height={preset.icon}
              className="object-contain"
            />
          </motion.div>
        );
      })}

      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
        style={{
          width: `${preset.center}px`,
          height: `${preset.center}px`
        }}
      >
        <motion.div
          animate={{
            scale: shieldPulse ? [1, 1.15, 1] : 1
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="relative">
            <Shield
              className="text-blue-500"
              size={preset.center * 0.7}
              strokeWidth={2}
              fill="rgba(59, 130, 246, 0.1)"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/taki.png"
                alt="Giveaway Dog"
                width={preset.center * 0.35}
                height={preset.center * 0.35}
                className="object-contain"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
