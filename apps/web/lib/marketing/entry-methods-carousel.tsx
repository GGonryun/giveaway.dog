'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  UsersIcon,
  Music,
  ShieldCheck,
  ImportIcon,
  ZapIcon,
  ClockIcon
} from 'lucide-react';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { SocialYouTubeIcon } from '@/lib/integrations/components/icons/youtube';
import { SocialInstagramIcon } from '@/lib/integrations/components/icons/instagram';
import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';
import { SocialBlueskyIcon } from '../integrations/components/icons/bluesky-icon';
import { SocialFacebookIcon } from '../integrations/components/icons/facebook-icon';
import { SocialTwitchIcon } from '../integrations/components/icons/twitch-icon';
import { SocialKickIcon } from '../integrations/components/icons/kick-icon';
import { SocialSteamIcon } from '../integrations/components/icons/steam-icon';
import { SocialTikTokIcon } from '../integrations/components/icons/tiktok-icon';

interface EntryMethod {
  id: string;
  icon: React.ElementType;
  label: string;
  enabled: boolean;
  theme: string;
  badge?: 'verified' | 'import' | 'automatic';
}

const entryMethods: EntryMethod[] = [
  {
    id: 'bluesky-follow',
    icon: SocialBlueskyIcon,
    label: 'Follow on Bluesky',
    enabled: true,
    theme: 'bg-bluesky-1 text-white',
    badge: 'verified'
  },
  {
    id: 'twitter-retweet',
    icon: SocialXIcon,
    label: 'Repost on X',
    enabled: false,
    theme: 'bg-black text-white',
    badge: 'import'
  },
  {
    id: 'discord-join',
    icon: SocialDiscordIcon,
    label: 'Join Discord',
    enabled: true,
    theme: 'bg-discord-1 text-white',
    badge: 'verified'
  },
  {
    id: 'twitch-follow',
    icon: SocialTwitchIcon,
    label: 'Follow on Twitch',
    enabled: true,
    theme: 'bg-twitch-1 text-white'
  },
  {
    id: 'refer-friend',
    icon: UsersIcon,
    label: 'Refer a Friend',
    enabled: false,
    theme: 'bg-amber-500 text-amber-100',
    badge: 'automatic'
  },
  {
    id: 'timed-action',
    icon: ClockIcon,
    label: 'Bonus Entries',
    enabled: false,
    theme: 'bg-purple-500 text-white'
  },
  {
    id: 'steam-wishlist',
    icon: SocialSteamIcon,
    label: 'Wishlist a Game',
    enabled: true,
    theme: 'bg-steam-1 text-white',
    badge: 'automatic'
  },
  {
    id: 'youtube-subscribe',
    icon: SocialYouTubeIcon,
    label: 'YouTube Subscribe',
    enabled: false,
    theme: 'bg-youtube-1 text-white'
  },
  {
    id: 'tiktok-share',
    icon: SocialTikTokIcon,
    label: 'Share on TikTok',
    enabled: false,
    theme: 'bg-black text-white',
    badge: 'verified'
  },
  {
    id: 'instagram-comment',
    icon: SocialInstagramIcon,
    label: 'Comment on Instagram',
    enabled: true,
    theme: 'bg-instagram-1 text-white',
    badge: 'import'
  },
  {
    id: 'kick-follow',
    icon: SocialKickIcon,
    label: 'Follow on Kick',
    enabled: true,
    theme: 'bg-kick-1 text-white'
  },
  {
    id: 'facebook-follow',
    icon: SocialFacebookIcon,
    label: 'Facebook Follow',
    enabled: false,
    theme: 'bg-facebook-1 text-white',
    badge: 'verified'
  }
];

function EntryMethodsGrid() {
  const [methods, setMethods] = useState(entryMethods);
  const [currentPage, setCurrentPage] = useState(0);
  const methodsPerPage = 6;
  const totalPages = Math.ceil(methods.length / methodsPerPage);

  const toggleMethod = (id: string) => {
    setMethods((prev) =>
      prev.map((method) =>
        method.id === id ? { ...method, enabled: !method.enabled } : method
      )
    );
  };

  const currentMethods = methods.slice(
    currentPage * methodsPerPage,
    (currentPage + 1) * methodsPerPage
  );

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden px-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Entry Methods:</span>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {methods.filter((m) => m.enabled).length} active
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={currentPage === totalPages - 1}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="absolute inset-x-0 top-8 bottom-0 flex flex-col gap-2  px-1">
        <AnimatePresence>
          {currentMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => toggleMethod(method.id)}
                className={`
                  relative flex items-center gap-2 py-1 pl-2 pr-1
                  rounded-lg border shadow-xs transition-all duration-200 cursor-pointer
                  ${
                    method.enabled
                      ? 'bg-background border-border'
                      : 'bg-muted/30 border-border/50 opacity-60'
                  }
                  hover:scale-102 active:scale-98
                `}
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 p-0.5 rounded-md border ${method.theme}`}
                >
                  <Icon />
                </div>
                <p className="flex-1 min-w-0 truncate text-sm">
                  {method.label}
                </p>

                {/* Badge */}
                {method.badge && (
                  <Badge
                    variant={
                      method.badge === 'verified'
                        ? 'success'
                        : method.badge === 'automatic'
                          ? 'info'
                          : 'secondary'
                    }
                    className="px-1.5 text-xs"
                  >
                    {method.badge === 'verified' ? (
                      <>
                        <ShieldCheck className="mr-0.5 h-3 w-3" /> Verified
                      </>
                    ) : method.badge === 'automatic' ? (
                      <>
                        <ZapIcon className="mr-0.5 h-3 w-3" /> Automatic
                      </>
                    ) : (
                      <>
                        <ImportIcon className="mr-0.5 h-3 w-3" /> Import
                      </>
                    )}
                  </Badge>
                )}

                {/* Toggle indicator */}
                <div className="shrink-0">
                  <div
                    className={`
                    h-5 w-9 rounded-full transition-all duration-200 flex items-center
                    ${method.enabled ? 'bg-[rgb(57,209,140)]' : 'bg-muted'}
                  `}
                    style={{
                      boxShadow: method.enabled
                        ? 'rgba(0, 0, 0, 0.04) 0px 2px 4px 0px, rgba(0, 0, 0, 0.02) 0px 0px 8px 0px inset, rgba(0, 0, 0, 0.06) 0px 0px 0px 0.5px inset, rgba(0, 0, 0, 0.04) 0px 2px 4px 0px inset, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px inset'
                        : 'rgba(0, 0, 0, 0.04) 0px 2px 4px 0px, rgba(0, 0, 0, 0.02) 0px 0px 8px 0px inset'
                    }}
                  >
                    <div
                      className={`
                      h-4 w-4 rounded-full bg-white
                      transition-all duration-200
                      ${method.enabled ? 'ml-4' : 'ml-0.5'}
                    `}
                      style={{
                        boxShadow:
                          'rgba(0, 0, 0, 0.08) 0px 0px 1px 0px, rgba(0, 0, 0, 0.12) 0px 1px 2px 0px, rgba(0, 0, 0, 0.04) 0px 3px 3px 0px, rgba(0, 0, 0, 0.02) 0px 5px 4px 0px, rgba(0, 0, 0, 0.02) 0px 0px 0px 0.5px, rgb(255, 255, 255) 0px 1px 0px 0px inset, rgb(255, 255, 255) 0px 0px 2px 1px inset'
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none bg-linear-to-t from-background via-background/50 to-transparent" />
    </div>
  );
}

interface EntryMethodsCarouselSectionProps {
  initialTheme?: string;
}

export const EntryMethodsCarouselSection = ({
  initialTheme
}: EntryMethodsCarouselSectionProps) => {
  return (
    <div className="w-full flex items-center justify-center">
      <div className="bg-background relative h-120 w-full rounded-3xl max-w-lg border border-border/40 flex flex-col shadow-xl overflow-hidden">
        <div className="relative flex-1 p-6">
          <EntryMethodsGrid />
        </div>

        <div className="relative px-8 pt-1 pb-6 backdrop-blur-sm shrink-0 space-y-2 bg-card/95">
          <h3 className="text-lg font-semibold text-foreground">
            Edit everything, instantly
          </h3>
          <p className="text-muted-foreground text-sm">
            Fine-tune your giveaway design, entry methods, and pickers with our
            intuitive visual editor. Make changes on the fly without any coding
            or technical expertise.
          </p>
        </div>
      </div>
    </div>
  );
};
