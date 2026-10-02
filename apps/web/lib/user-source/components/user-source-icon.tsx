import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { SocialBlueskyIcon } from '@/lib/integrations/components/icons/bluesky-icon';
import { cn } from '@/lib/utils';
import { UserSource } from '@prisma/client';
import {
  EditIcon,
  HatGlassesIcon,
  LucideIcon,
  VerifiedIcon
} from 'lucide-react';
import { SocialTwitchIcon } from '@/lib/integrations/components/icons/twitch-icon';

export const USER_SOURCE_ICON: Record<UserSource, LucideIcon> = {
  TWITTER_IMPORT: SocialXIcon,
  BLUESKY_IMPORT: SocialBlueskyIcon,
  SIGNUP: VerifiedIcon,
  DISCORD_IMPORT: SocialDiscordIcon,
  TWITCH_IMPORT: SocialTwitchIcon,
  MANUAL_IMPORT: EditIcon,
  ANONYMOUS: HatGlassesIcon
};

export const UserSourceIcon: React.FC<{ source: UserSource; size: number }> = ({
  source,
  size = 6
}) => {
  const Icon = USER_SOURCE_ICON[source];
  return <Icon className={cn(`w-${size} h-${size}`)} />;
};
