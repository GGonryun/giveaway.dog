import { TaskType } from '@prisma/client';
import { Globe2Icon, HatGlassesIcon, MailIcon, StarIcon } from 'lucide-react';

import { TASK_PLATFORM } from '@/lib/task/schemas';
import { assertNever } from '@/lib/errors';
import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';
import { SocialGoogleIcon } from '@/lib/integrations/components/icons/google-icon';
import { SocialSteamIcon } from '@/lib/integrations/components/icons/steam-icon';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { SocialKickIcon } from '@/lib/integrations/components/icons/kick-icon';
import { SocialYouTubeIcon } from '@/lib/integrations/components/icons/youtube';
import { SocialInstagramIcon } from '@/lib/integrations/components/icons/instagram';
import { SocialFacebookIcon } from '@/lib/integrations/components/icons/facebook-icon';
import { SocialTikTokIcon } from '@/lib/integrations/components/icons/tiktok-icon';

export const TaskPlatformIcon: React.FC<{ type: TaskType }> = ({ type }) => {
  const platform = TASK_PLATFORM[type];

  switch (platform) {
    case 'bonus':
      return <StarIcon className="h-4 w-4 text-gray-500" />;
    case 'website':
      return <Globe2Icon className="h-4 w-4 text-gray-500" />;
    case 'email':
      return <MailIcon className="h-4 w-4 text-gray-500" />;
    case 'twitter':
      return <SocialXIcon className="h-4 w-4 text-black" />;
    case 'steam':
      return <SocialSteamIcon className="h-4 w-4 text-steam-1" />;
    case 'discord':
      return <SocialDiscordIcon className="h-4 w-4 text-discord-1" />;
    case 'google':
      return <SocialGoogleIcon className="h-4 w-4 text-black" />;
    case 'twitch':
      return <SocialDiscordIcon className="h-4 w-4 text-twitch-1" />;
    case 'kick':
      return <SocialKickIcon className="h-4 w-4 text-kick-1" />;
    case 'youtube':
      return <SocialYouTubeIcon className="h-4 w-4 text-youtube-1" />;
    case 'instagram':
      return <SocialInstagramIcon className="h-4 w-4 text-instagram-1" />;
    case 'facebook':
      return <SocialFacebookIcon className="h-4 w-4 text-facebook-1" />;
    case 'tiktok':
      return <SocialTikTokIcon className="h-4 w-4 text-black" />;
    case 'anonymous':
      return <HatGlassesIcon className="h-4 w-4 text-gray-500" />;
    default:
      throw assertNever(platform);
  }
};
