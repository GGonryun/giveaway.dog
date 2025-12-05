import React from 'react';
import { Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SocialXIcon } from './x-icon';
import { SocialGoogleIcon } from './google-icon';
import { SocialDiscordIcon } from './discord-icon';
import { SocialSteamIcon } from './steam-icon';
import { SocialTwitchIcon } from './twitch-icon';
import { ProviderTypeSchema } from '../../schemas/providers';
import { SocialKickIcon } from './kick-icon';
import { SocialYouTubeIcon } from './youtube';
import { SocialInstagramIcon } from './instagram';

interface ProviderIconProps {
  type: ProviderTypeSchema;
  className?: string;
}

export const PROVIDER_ICON: Record<
  ProviderTypeSchema,
  React.FC<{ className?: string }>
> = {
  youtube: SocialYouTubeIcon,
  email: Mail,
  twitter: SocialXIcon,
  google: SocialGoogleIcon,
  discord: SocialDiscordIcon,
  steam: SocialSteamIcon,
  twitch: SocialTwitchIcon,
  kick: SocialKickIcon,
  instagram: SocialInstagramIcon
};

export const ProviderIcon: React.FC<ProviderIconProps> = ({
  type,
  className = 'w-4 h-4'
}) => {
  const IconComponent = PROVIDER_ICON[type];
  return <IconComponent className={cn(className)} />;
};
