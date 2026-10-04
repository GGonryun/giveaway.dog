import {
  Globe2Icon,
  HatGlassesIcon,
  MailIcon,
  MessageSquareIcon,
  StarIcon
} from 'lucide-react';

import { TASK_PLATFORM, TaskType } from '@giveaway/task-model/schemas';
import { assertNever } from '@giveaway/util-errors';
import { SocialDiscordIcon } from '@giveaway/integration-icons/discord-icon';
import { SocialGoogleIcon } from '@giveaway/integration-icons/google-icon';
import { SocialSteamIcon } from '@giveaway/integration-icons/steam-icon';
import { SocialXIcon } from '@giveaway/integration-icons/x-icon';
import { SocialKickIcon } from '@giveaway/integration-icons/kick-icon';
import { SocialYouTubeIcon } from '@giveaway/integration-icons/youtube';
import { SocialInstagramIcon } from '@giveaway/integration-icons/instagram';
import { SocialFacebookIcon } from '@giveaway/integration-icons/facebook-icon';
import { SocialTikTokIcon } from '@giveaway/integration-icons/tiktok-icon';
import { SocialBlueskyIcon } from '@giveaway/integration-icons/bluesky-icon';
import { SocialVeloraIcon } from '@giveaway/integration-icons/velora-icon';
import { SocialLinkedInIcon } from '@giveaway/integration-icons/linked-in-icon';

export const TaskPlatformIcon: React.FC<{ type: TaskType }> = ({ type }) => {
  const platform = TASK_PLATFORM[type];

  switch (platform) {
    case 'BONUS':
      return <StarIcon className="h-4 w-4 text-gray-500" />;
    case 'WEBSITE':
      return <Globe2Icon className="h-4 w-4 text-gray-500" />;
    case 'QUESTION':
      return <MessageSquareIcon className="h-4 w-4 text-gray-500" />;
    case 'EMAIL':
      return <MailIcon className="h-4 w-4 text-gray-500" />;
    case 'TWITTER':
      return <SocialXIcon className="h-4 w-4 text-black" />;
    case 'BLUESKY':
      return <SocialBlueskyIcon className="h-4 w-4 text-[#1185fe]" />;
    case 'STEAM':
      return <SocialSteamIcon className="h-4 w-4 text-steam-1" />;
    case 'DISCORD':
      return <SocialDiscordIcon className="h-4 w-4 text-discord-1" />;
    case 'GOOGLE':
      return <SocialGoogleIcon className="h-4 w-4 text-black" />;
    case 'TWITCH':
      return <SocialDiscordIcon className="h-4 w-4 text-twitch-1" />;
    case 'KICK':
      return <SocialKickIcon className="h-4 w-4 text-kick-1" />;
    case 'YOUTUBE':
      return <SocialYouTubeIcon className="h-4 w-4 text-youtube-1" />;
    case 'INSTAGRAM':
      return <SocialInstagramIcon className="h-4 w-4 text-instagram-1" />;
    case 'FACEBOOK':
      return <SocialFacebookIcon className="h-4 w-4 text-facebook-1" />;
    case 'TIKTOK':
      return <SocialTikTokIcon className="h-4 w-4 text-black" />;
    case 'VELORA':
      return <SocialVeloraIcon className="h-4 w-4 text-facebook-1" />;
    case 'LINKEDIN':
      return <SocialLinkedInIcon className="h-4 w-4 text-[#0A66C2]" />;
    case 'ANONYMOUS':
      return <HatGlassesIcon className="h-4 w-4 text-gray-500" />;
    default:
      throw assertNever(platform);
  }
};
