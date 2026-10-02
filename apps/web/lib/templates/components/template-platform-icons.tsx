import { TaskPlatformSchema } from '@/lib/task/schemas';
import { assertNever } from '@giveaway/util-errors';
import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';
import { SocialGoogleIcon } from '@/lib/integrations/components/icons/google-icon';
import { SocialSteamIcon } from '@/lib/integrations/components/icons/steam-icon';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { SocialKickIcon } from '@/lib/integrations/components/icons/kick-icon';
import { SocialYouTubeIcon } from '@/lib/integrations/components/icons/youtube';
import { SocialInstagramIcon } from '@/lib/integrations/components/icons/instagram';
import { SocialFacebookIcon } from '@/lib/integrations/components/icons/facebook-icon';
import { SocialTikTokIcon } from '@/lib/integrations/components/icons/tiktok-icon';
import { SocialBlueskyIcon } from '@/lib/integrations/components/icons/bluesky-icon';
import { SocialTwitchIcon } from '@/lib/integrations/components/icons/twitch-icon';
import { Globe2Icon } from 'lucide-react';
import { SocialVeloraIcon } from '@/lib/integrations/components/icons/velora-icon';
import { SocialLinkedInIcon } from '@/lib/integrations/components/icons/linked-in-icon';

interface PlatformIconProps {
  platform: TaskPlatformSchema;
  className?: string;
}

const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  className = 'h-4 w-4'
}) => {
  switch (platform) {
    case 'WEBSITE':
      return <Globe2Icon className={className} />;
    case 'TWITTER':
      return <SocialXIcon className={className} />;
    case 'BLUESKY':
      return <SocialBlueskyIcon className={className} />;
    case 'STEAM':
      return <SocialSteamIcon className={className} />;
    case 'DISCORD':
      return <SocialDiscordIcon className={className} />;
    case 'GOOGLE':
      return <SocialGoogleIcon className={className} />;
    case 'TWITCH':
      return <SocialTwitchIcon className={className} />;
    case 'KICK':
      return <SocialKickIcon className={className} />;
    case 'YOUTUBE':
      return <SocialYouTubeIcon className={className} />;
    case 'INSTAGRAM':
      return <SocialInstagramIcon className={className} />;
    case 'FACEBOOK':
      return <SocialFacebookIcon className={className} />;
    case 'TIKTOK':
      return <SocialTikTokIcon className={className} />;
    case 'VELORA':
      return <SocialVeloraIcon className={className} />;
    case 'LINKEDIN':
      return <SocialLinkedInIcon className={className} />;
    case 'BONUS':
    case 'QUESTION':
    case 'EMAIL':
    case 'ANONYMOUS':
      return null;
    default:
      throw assertNever(platform);
  }
};

interface TemplatePlatformIconsProps {
  platforms: TaskPlatformSchema[];
  maxIcons?: number;
}

export const TemplatePlatformIcons: React.FC<TemplatePlatformIconsProps> = ({
  platforms,
  maxIcons = 4
}) => {
  const displayPlatforms = platforms.slice(0, maxIcons);
  const remainingCount = platforms.length - maxIcons;

  if (platforms.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      {displayPlatforms.map((platform, index) => (
        <div
          key={`${platform}-${index}`}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-background/95 backdrop-blur-sm border border-border/50 shadow-sm"
        >
          <PlatformIcon platform={platform} className="h-3.5 w-3.5" />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background/95 backdrop-blur-sm border border-border/50 shadow-sm">
          <span className="text-[10px] font-medium text-muted-foreground">
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  );
};
