import React from 'react';
import { HatGlassesIcon, MailIcon } from 'lucide-react';
import { cn } from '@giveaway/ui-utils/utils';
import { SocialXIcon } from './x-icon';
import { SocialGoogleIcon } from './google-icon';
import { SocialDiscordIcon } from './discord-icon';
import { SocialSteamIcon } from './steam-icon';
import { SocialTwitchIcon } from './twitch-icon';
import {
  IDENTITY_PROVIDER_LABEL,
  IdentityProviderSchema
} from '@giveaway/integration-model/providers';
import { SocialKickIcon } from './kick-icon';
import { SocialYouTubeIcon } from './youtube';
import { SocialInstagramIcon } from './instagram';
import { SocialFacebookIcon } from './facebook-icon';
import { SocialTikTokIcon } from './tiktok-icon';
import { SocialBlueskyIcon } from './bluesky-icon';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@giveaway/ui-primitives/tooltip';
import { SocialVeloraIcon } from './velora-icon';
import { SocialLinkedInIcon } from './linked-in-icon';

interface ProviderIconProps {
  type: IdentityProviderSchema;
  className?: string;
}

export const PROVIDER_ICON: Record<
  IdentityProviderSchema,
  React.FC<{ className?: string }>
> = {
  YOUTUBE: SocialYouTubeIcon,
  EMAIL: MailIcon,
  TWITTER: SocialXIcon,
  GOOGLE: SocialGoogleIcon,
  BLUESKY: SocialBlueskyIcon,
  DISCORD: SocialDiscordIcon,
  STEAM: SocialSteamIcon,
  TWITCH: SocialTwitchIcon,
  KICK: SocialKickIcon,
  INSTAGRAM: SocialInstagramIcon,
  FACEBOOK: SocialFacebookIcon,
  TIKTOK: SocialTikTokIcon,
  VELORA: SocialVeloraIcon,
  LINKEDIN: SocialLinkedInIcon,
  ANONYMOUS: HatGlassesIcon
};

export const PROVIDER_THEME: Record<
  IdentityProviderSchema,
  { bgColor: string; textColor: string; fillColor: string }
> = {
  YOUTUBE: {
    bgColor: 'bg-youtube-1',
    textColor: 'text-white',
    fillColor: 'fill-youtube-1'
  },
  EMAIL: {
    bgColor: 'bg-gray-700',
    textColor: 'text-white',
    fillColor: 'fill-gray-700'
  },
  TWITTER: {
    bgColor: 'bg-black',
    textColor: 'text-white',
    fillColor: 'fill-black'
  },
  BLUESKY: {
    bgColor: 'bg-bluesky-1',
    textColor: 'text-white',
    fillColor: 'fill-bluesky-1'
  },
  GOOGLE: {
    bgColor: 'bg-google-1',
    textColor: 'text-white',
    fillColor: 'fill-google-1'
  },
  DISCORD: {
    bgColor: 'bg-discord-1',
    textColor: 'text-white',
    fillColor: 'fill-discord-1'
  },
  STEAM: {
    bgColor: 'bg-steam-1',
    textColor: 'text-white',
    fillColor: 'fill-steam-1'
  },
  TWITCH: {
    bgColor: 'bg-twitch-1',
    textColor: 'text-white',
    fillColor: 'fill-twitch-1'
  },
  KICK: {
    bgColor: 'bg-black',
    textColor: 'text-white',
    fillColor: 'fill-black'
  },
  INSTAGRAM: {
    bgColor: 'bg-instagram-1',
    textColor: 'text-white',
    fillColor: 'fill-instagram-1'
  },
  FACEBOOK: {
    bgColor: 'bg-facebook-1',
    textColor: 'text-white',
    fillColor: 'fill-facebook-1'
  },
  TIKTOK: {
    bgColor: 'bg-black',
    textColor: 'text-white',
    fillColor: 'fill-black'
  },
  VELORA: {
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
    fillColor: 'fill-purple-600'
  },
  LINKEDIN: {
    bgColor: 'bg-[#0A66C2]',
    textColor: 'text-white',
    fillColor: 'fill-[#0A66C2]'
  },
  ANONYMOUS: {
    bgColor: 'bg-gray-700',
    textColor: 'text-white',
    fillColor: 'fill-gray-700'
  }
};

export const ProviderIcon: React.FC<ProviderIconProps> = ({
  type,
  className = 'w-4 h-4'
}) => {
  const IconComponent = PROVIDER_ICON[type];

  return <IconComponent className={cn(className)} />;
};

export const ThemedProviderIcon: React.FC<ProviderIconProps> = ({
  type,
  className = 'w-4 h-4'
}) => {
  const IconComponent = PROVIDER_ICON[type];
  const theme = PROVIDER_THEME[type];

  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          className={cn(
            'cursor-pointer inline-flex items-center justify-center rounded-full p-3',
            theme.bgColor,
            'hover:scale-110 transition-transform duration-200 ease-in-out',
            'hover:shadow-lg'
          )}
        >
          <IconComponent className={cn(className, theme.textColor, 'size-5')} />
        </div>
      </TooltipTrigger>
      <TooltipContent
        className={cn(theme.fillColor, theme.bgColor)}
        arrowClassName={cn(theme.fillColor, theme.bgColor)}
      >
        <span className={cn('font-semibold', theme.textColor)}>
          {IDENTITY_PROVIDER_LABEL[type]}
        </span>
      </TooltipContent>
    </Tooltip>
  );
};
