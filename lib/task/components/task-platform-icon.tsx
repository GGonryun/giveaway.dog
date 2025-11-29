import { TaskType } from '@prisma/client';
import { Database, Globe2Icon, MailIcon } from 'lucide-react';

import { TASK_PLATFORM } from '@/lib/task/schemas';
import { assertNever } from '@/lib/errors';
import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';
import { SocialGoogleIcon } from '@/lib/integrations/components/icons/google-icon';
import { SocialSteamIcon } from '@/lib/integrations/components/icons/steam-icon';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { SocialKickIcon } from '@/lib/integrations/components/icons/kick-icon';
import { SocialYouTubeIcon } from '@/lib/integrations/components/icons/youtube';

export const TaskPlatformIcon: React.FC<{ type: TaskType }> = ({ type }) => {
  const platform = TASK_PLATFORM[type];

  switch (platform) {
    case 'website':
      return <Globe2Icon className="h-4 w-4 text-gray-500" />;
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
    case 'email':
      return <MailIcon className="h-4 w-4 text-gray-500" />;
    case 'kick':
      return <SocialKickIcon className="h-4 w-4 text-kick-1" />;
    case 'form':
      return <Database className="h-4 w-4 text-gray-500" />;
    case 'youtube':
      return <SocialYouTubeIcon className="h-4 w-4 text-youtube-1" />;
    default:
      throw assertNever(platform);
  }
};
