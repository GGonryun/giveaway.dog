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
  {
    bgColor: string;
    textColor: string;
    fillColor: string;
    interactiveColor: string;
  }
> = {
  YOUTUBE: {
    bgColor: 'bg-youtube-1',
    textColor: 'text-white',
    fillColor: 'fill-youtube-1',
    interactiveColor:
      'hover:bg-youtube-1/80 hover:text-white/80 focus:bg-youtube-1/80 focus:text-white/80 dark:hover:bg-youtube-1/80 dark:hover:text-white/80 dark:focus:bg-youtube-1/80 dark:focus:text-white/80'
  },
  EMAIL: {
    bgColor: 'bg-gray-700',
    textColor: 'text-white',
    fillColor: 'fill-gray-700',
    interactiveColor:
      'hover:bg-gray-700/80 hover:text-white/80 focus:bg-gray-700/80 focus:text-white/80 dark:hover:bg-gray-700/80 dark:hover:text-white/80 dark:focus:bg-gray-700/80 dark:focus:text-white/80'
  },
  TWITTER: {
    bgColor: 'bg-black',
    textColor: 'text-white',
    fillColor: 'fill-black',
    interactiveColor:
      'hover:bg-black/80 hover:text-white/80 focus:bg-black/80 focus:text-white/80 dark:hover:bg-black/80 dark:hover:text-white/80 dark:focus:bg-black/80 dark:focus:text-white/80'
  },
  BLUESKY: {
    bgColor: 'bg-bluesky-1',
    textColor: 'text-white',
    fillColor: 'fill-bluesky-1',
    interactiveColor:
      'hover:bg-bluesky-1/80 hover:text-white/80 focus:bg-bluesky-1/80 focus:text-white/80 dark:hover:bg-bluesky-1/80 dark:hover:text-white/80 dark:focus:bg-bluesky-1/80 dark:focus:text-white/80'
  },
  GOOGLE: {
    bgColor: 'bg-google-1',
    textColor: 'text-white',
    fillColor: 'fill-google-1',
    interactiveColor:
      'hover:bg-google-1/80 hover:text-white/80 focus:bg-google-1/80 focus:text-white/80 dark:hover:bg-google-1/80 dark:hover:text-white/80 dark:focus:bg-google-1/80 dark:focus:text-white/80'
  },
  DISCORD: {
    bgColor: 'bg-discord-1',
    textColor: 'text-white',
    fillColor: 'fill-discord-1',
    interactiveColor:
      'hover:bg-discord-1/80 hover:text-white/80 focus:bg-discord-1/80 focus:text-white/80 dark:hover:bg-discord-1/80 dark:hover:text-white/80 dark:focus:bg-discord-1/80 dark:focus:text-white/80'
  },
  STEAM: {
    bgColor: 'bg-steam-1',
    textColor: 'text-white',
    fillColor: 'fill-steam-1',
    interactiveColor:
      'hover:bg-steam-1/80 hover:text-white/80 focus:bg-steam-1/80 focus:text-white/80 dark:hover:bg-steam-1/80 dark:hover:text-white/80 dark:focus:bg-steam-1/80 dark:focus:text-white/80'
  },
  TWITCH: {
    bgColor: 'bg-twitch-1',
    textColor: 'text-white',
    fillColor: 'fill-twitch-1',
    interactiveColor:
      'hover:bg-twitch-1/80 hover:text-white/80 focus:bg-twitch-1/80 focus:text-white/80 dark:hover:bg-twitch-1/80 dark:hover:text-white/80 dark:focus:bg-twitch-1/80 dark:focus:text-white/80'
  },
  KICK: {
    bgColor: 'bg-black',
    textColor: 'text-white',
    fillColor: 'fill-black',
    interactiveColor:
      'hover:bg-black/80 hover:text-white/80 focus:bg-black/80 focus:text-white/80 dark:hover:bg-black/80 dark:hover:text-white/80 dark:focus:bg-black/80 dark:focus:text-white/80'
  },
  INSTAGRAM: {
    bgColor: 'bg-instagram-1',
    textColor: 'text-white',
    fillColor: 'fill-instagram-1',
    interactiveColor:
      'hover:bg-instagram-1/80 hover:text-white/80 focus:bg-instagram-1/80 focus:text-white/80 dark:hover:bg-instagram-1/80 dark:hover:text-white/80 dark:focus:bg-instagram-1/80 dark:focus:text-white/80'
  },
  FACEBOOK: {
    bgColor: 'bg-facebook-1',
    textColor: 'text-white',
    fillColor: 'fill-facebook-1',
    interactiveColor:
      'hover:bg-facebook-1/80 hover:text-white/80 focus:bg-facebook-1/80 focus:text-white/80 dark:hover:bg-facebook-1/80 dark:hover:text-white/80 dark:focus:bg-facebook-1/80 dark:focus:text-white/80'
  },
  TIKTOK: {
    bgColor: 'bg-black',
    textColor: 'text-white',
    fillColor: 'fill-black',
    interactiveColor:
      'hover:bg-black/80 hover:text-white/80 focus:bg-black/80 focus:text-white/80 dark:hover:bg-black/80 dark:hover:text-white/80 dark:focus:bg-black/80 dark:focus:text-white/80'
  },
  VELORA: {
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
    fillColor: 'fill-purple-600',
    interactiveColor:
      'hover:bg-purple-600/80 hover:text-white/80 focus:bg-purple-600/80 focus:text-white/80 dark:hover:bg-purple-600/80 dark:hover:text-white/80 dark:focus:bg-purple-600/80 dark:focus:text-white/80'
  },
  LINKEDIN: {
    bgColor: 'bg-[#0A66C2]',
    textColor: 'text-white',
    fillColor: 'fill-[#0A66C2]',
    interactiveColor:
      'hover:bg-[#0A66C2]/80 hover:text-white/80 focus:bg-[#0A66C2]/80 focus:text-white/80 dark:hover:bg-[#0A66C2]/80 dark:hover:text-white/80 dark:focus:bg-[#0A66C2]/80 dark:focus:text-white/80'
  },
  ANONYMOUS: {
    bgColor: 'bg-gray-700',
    textColor: 'text-white',
    fillColor: 'fill-gray-700',
    interactiveColor:
      'hover:bg-gray-700/80 hover:text-white/80 focus:bg-gray-700/80 focus:text-white/80 dark:hover:bg-gray-700/80 dark:hover:text-white/80 dark:focus:bg-gray-700/80 dark:focus:text-white/80'
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
      <TooltipTrigger aria-label={IDENTITY_PROVIDER_LABEL[type]}>
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
