import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { cn } from '@/lib/utils';
import { UserSource } from '@prisma/client';
import { EditIcon, LucideIcon, VerifiedIcon } from 'lucide-react';

export const USER_SOURCE_ICON: Record<UserSource, LucideIcon> = {
  TWITTER_IMPORT: SocialXIcon,
  SIGNUP: VerifiedIcon,
  DISCORD_IMPORT: SocialDiscordIcon,
  MANUAL_IMPORT: EditIcon
};

export const UserSourceIcon: React.FC<{ source: UserSource; size: number }> = ({
  source,
  size = 6
}) => {
  const Icon = USER_SOURCE_ICON[source];
  return <Icon className={cn(`w-${size} h-${size}`)} />;
};
