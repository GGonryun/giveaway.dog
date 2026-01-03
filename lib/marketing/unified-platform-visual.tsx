'use client';

import { cn } from '@/lib/utils';
import { Gift, Users } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const platforms = [
  {
    name: 'Bluesky',
    src: '/platforms/bluesky.svg',
    hoverColor: 'hover:border-bluesky-1/50'
  },
  {
    name: 'Instagram',
    src: '/platforms/instagram.svg',
    hoverColor: 'hover:border-instagram-1/50'
  },
  {
    name: 'Twitter',
    src: '/platforms/x.svg',
    hoverColor: 'hover:border-twitter-1/50'
  },
  {
    name: 'Twitch',
    src: '/platforms/twitch.svg',
    hoverColor: 'hover:border-twitch-1/50'
  },
  {
    name: 'Discord',
    src: '/platforms/discord.svg',
    hoverColor: 'hover:border-discord-1/50'
  }
];

export const UnifiedPlatformSection = () => {
  return (
    <div className="w-full flex items-center justify-center">
      <div className="relative h-[480px] w-full rounded-3xl max-w-lg border border-border/40 overflow-hidden flex flex-col shadow-xl">
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-[1]" />
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5]">
            <defs>
              <style>{`
              @keyframes travelLineFromRight {
                0% { stroke-dashoffset: -400; opacity: 1; }
                30% { stroke-dashoffset: 400; opacity: 1; }
                30.01% { opacity: 0; }
                100% { stroke-dashoffset: -400; opacity: 0; }
              }
              @keyframes travelLineFromCenter {
                0% { stroke-dashoffset: -300; opacity: 1; }
                30% { stroke-dashoffset: 300; opacity: 1; }
                30.01% { opacity: 0; }
                100% { stroke-dashoffset: -300; opacity: 0; }
              }
              .animated-line-left {
                stroke-dasharray: 80 1000;
                animation: travelLineFromCenter 3s linear 0.4s infinite;
              }
              .animated-line-right {
                stroke-dasharray: 80 1000;
                animation: travelLineFromRight 3s linear infinite;
              }
            `}</style>
            </defs>

            <GraphLine x1="15%" y1="50%" x2="50%" y2="50%" animated />
            <GraphLine x1="50%" y1="50%" x2="85%" y2="17%" animated />
            <GraphLine x1="50%" y1="50%" x2="85%" y2="31%" animated />
            <GraphLine x1="50%" y1="50%" x2="85%" y2="50%" animated />
            <GraphLine x1="50%" y1="50%" x2="85%" y2="69%" animated />
            <GraphLine x1="50%" y1="50%" x2="85%" y2="83%" animated />
          </svg>

          <div
            className="absolute group z-10"
            style={{
              left: '10%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="relative w-32 h-40 rounded-xl border-2 border-border bg-background shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:border-primary/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
              <div className="relative p-2 flex flex-col h-full">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Gift className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-foreground/10 rounded w-16 mb-1" />
                    <div className="h-1.5 bg-foreground/5 rounded w-12" />
                  </div>
                </div>

                <div className="space-y-1 mb-auto">
                  <div className="h-1.5 bg-foreground/10 rounded w-full" />
                  <div className="h-1.5 bg-foreground/10 rounded w-20" />
                </div>

                <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Users className="w-2.5 h-2.5 text-muted-foreground" />
                    <div className="h-1.5 bg-foreground/10 rounded w-8" />
                  </div>
                  <div className="h-4 bg-primary/80 rounded px-2 flex items-center">
                    <div className="h-1 bg-primary-foreground/90 rounded w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="absolute group z-20"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="flex size-16 items-center justify-center rounded-full border-2 border-border bg-background shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:border-primary/30">
              <Image
                src="/taki.png"
                alt="Taki Picture"
                width={32}
                height={32}
                sizes="32px"
              />
            </div>
          </div>

          <div
            className="absolute flex flex-col gap-3.5 z-10"
            style={{
              left: '85%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className={cn(
                  'group flex size-14 items-center justify-center rounded-full border-2 border-border bg-background shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl cursor-pointer',
                  platform.hoverColor
                )}
              >
                <img
                  alt={platform.name}
                  loading="lazy"
                  width={22}
                  height={22}
                  className="transition-transform duration-300 group-hover:scale-110"
                  src={platform.src}
                />
              </div>
            ))}
          </div>

          {/* Bottom fade gradient - creates soft transition where animation meets text */}
          <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none z-10 bg-gradient-to-t from-background/95 via-background/60 to-transparent" />
        </div>

        <div className="relative px-8 py-6 backdrop-blur-sm flex-shrink-0 space-y-2 bg-card">
          <h3 className="text-lg font-semibold text-foreground">
            One Platform, Endless Possibilities
          </h3>
          <p className="text-muted-foreground text-sm">
            Manage all your giveaways from a single unified dashboard. Track
            entries, verify participants, and pick winners across all your
            connected platforms with ease.
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

const GraphLine = ({
  x1,
  y1,
  x2,
  y2,
  animated = false
}: {
  x1: string;
  y1: string;
  x2: string;
  y2: string;
  animated?: boolean;
}) => (
  <>
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth="2.5"
      className="text-muted-foreground/15"
    />
    {animated && (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="currentColor"
        strokeWidth="3"
        className={`text-primary ${x1 === '15%' ? 'animated-line-left' : 'animated-line-right'}`}
      />
    )}
  </>
);
