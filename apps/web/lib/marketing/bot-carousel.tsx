'use client';

import { motion, useAnimationFrame } from 'framer-motion';
import { useRef, useState } from 'react';
import type { ResolvedTheme } from '../theme/get-server-theme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  toQualityType,
  QUALITY_DESCRIPTION,
  QUALITY_BADGE_RISK,
  QUALITY_BADGE_TEXT
} from '@giveaway/user-quality-model/quality';
import {
  QUALITY_BADGE_VARIANT,
  QUALITY_ICON
} from '@/lib/user-quality/display';

interface BotUser {
  avatar: string;
  score: number;
}

const botUsers: BotUser[] = [
  { avatar: '/people/1.jpg', score: 95 },
  { avatar: '/people/2.jpg', score: 85 },
  { avatar: '/people/3.jpg', score: 92 },
  { avatar: '/people/4.jpg', score: 55 },
  { avatar: '/people/5.jpg', score: 88 },
  { avatar: '/people/6.jpg', score: 45 },
  { avatar: '/people/7.jpg', score: 90 },
  { avatar: '/people/8.jpg', score: 25 },
  { avatar: '/people/9.jpg', score: 78 },
  { avatar: '/people/10.jpg', score: 60 },
  { avatar: '/people/11.jpg', score: 35 },
  { avatar: '/people/12.jpg', score: 94 }
].map((user) => ({
  ...user,
  quality: toQualityType(user.score)
}));

function BotCarousel() {
  const cardHeight = 64;
  const gap = 8;
  const itemHeight = cardHeight + gap;
  const totalHeight = botUsers.length * itemHeight;
  const scrollDuration = 1500;

  const [offset, setOffset] = useState(0);
  const pauseRef = useRef(0);
  const progressRef = useRef(0);
  const startOffsetRef = useRef(0);

  const easeInOutQuint = (t: number): number => {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
  };

  useAnimationFrame((_time, delta) => {
    if (pauseRef.current > 0) {
      pauseRef.current -= delta;
      return;
    }

    progressRef.current += delta;

    if (progressRef.current >= scrollDuration) {
      startOffsetRef.current = offset % totalHeight;
      progressRef.current = 0;
      pauseRef.current = 3000;
    }

    const progress = Math.min(progressRef.current / scrollDuration, 1);
    const easedProgress = easeInOutQuint(progress);
    const newOffset =
      (startOffsetRef.current + easedProgress * itemHeight) % totalHeight;

    setOffset(newOffset);
  });

  const visibleItems = 9;
  const containerHeight = visibleItems * itemHeight;

  return (
    <div
      className="relative w-full overflow-hidden flex items-center justify-center"
      style={{ height: containerHeight }}
    >
      <div className="relative w-full max-w-md">
        {[...botUsers, ...botUsers].map((user, index) => {
          const itemPosition = index * itemHeight;
          const adjustedPosition =
            (itemPosition - offset + totalHeight * 2) % totalHeight;
          const centerY = containerHeight / 2;

          const y = adjustedPosition - centerY + itemHeight / 2;

          const itemsFromCenter = Math.abs(y) / itemHeight;
          const normalizedDistance = Math.min(itemsFromCenter, 4);
          const scale = Math.max(0.5, 1 - normalizedDistance * 0.125);

          const compressionFactor = 0.45 + scale * 0.55;
          const adjustedY = y * compressionFactor;

          const distanceFromCenter = Math.abs(adjustedY);
          const fadeStart = containerHeight / 2 - itemHeight * 2;
          const fadeEnd = containerHeight / 2 - itemHeight;
          const opacity =
            distanceFromCenter < fadeStart
              ? 1
              : distanceFromCenter > fadeEnd
                ? 0
                : Math.max(
                    0,
                    1 - (distanceFromCenter - fadeStart) / (fadeEnd - fadeStart)
                  );
          const quality = toQualityType(user.score);
          const Icon = QUALITY_ICON[quality];
          return (
            <motion.div
              key={`${user.avatar}-${index}`}
              className="absolute left-1/2 flex items-center gap-3 bg-card border rounded-lg px-4 py-3 shadow-sm origin-center w-[90%]"
              style={{
                y: adjustedY,
                x: '-50%',
                opacity,
                scale,
                height: cardHeight
              }}
            >
              <Image
                src={user.avatar}
                alt="User"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={QUALITY_BADGE_VARIANT[quality]}
                    className="text-xs flex items-center gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    {QUALITY_BADGE_TEXT[quality]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {QUALITY_BADGE_RISK[quality]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {QUALITY_DESCRIPTION[quality]}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
interface BotCarouselSectionProps {
  initialTheme: ResolvedTheme;
}

export const BotCarouselSection = ({
  initialTheme
}: BotCarouselSectionProps) => {
  return (
    <div className="w-full flex items-center justify-center">
      <div className="bg-background relative h-120 w-full rounded-3xl max-w-lg border border-border/40 overflow-hidden flex flex-col shadow-xl">
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 -top-44">
            <BotCarousel />
          </div>

          {/* Top fade gradient */}
          <div className="absolute inset-x-0 top-0 h-40 pointer-events-none z-10 bg-linear-to-b from-background/90 via-background/5 to-transparent" />

          {/* Bottom fade gradient - creates soft transition where animation meets text */}
          <div className="absolute inset-x-0 bottom-0 h-56 pointer-events-none z-10 bg-linear-to-t from-background/95 via-background/5 to-transparent" />
        </div>

        <div className="relative px-8 py-6 backdrop-blur-sm shrink-0 space-y-2 bg-card">
          <h3 className="text-lg font-semibold text-foreground">
            Verified engagement
          </h3>
          <p className="text-muted-foreground text-sm">
            Our automated fraud detection ensures only real humans can enter
            your giveaways. Protect your audience, maintain fair play, and grow
            your community with verified engagement.
          </p>
        </div>
      </div>
    </div>
  );
};
