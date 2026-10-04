import { SocialDiscordIcon } from '@giveaway/integration-icons/discord-icon';
import { SocialXIcon } from '@giveaway/integration-icons/x-icon';
import { SocialBlueskyIcon } from '@giveaway/integration-icons/bluesky-icon';
import { cn } from '@giveaway/ui-utils/utils';
import { UserSource } from '@giveaway/db-model';
import {
  EditIcon,
  HatGlassesIcon,
  LucideIcon,
  VerifiedIcon
} from 'lucide-react';
import { SocialTwitchIcon } from '@giveaway/integration-icons/twitch-icon';

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
