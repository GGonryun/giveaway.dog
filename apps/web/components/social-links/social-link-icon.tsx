import { Globe, type LucideIcon } from 'lucide-react';
import { type SocialPlatform } from '@/schemas/social-links';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SocialXIcon } from '../../lib/integrations/components/icons/x-icon';
import { SocialDiscordIcon } from '../../lib/integrations/components/icons/discord-icon';
import { SocialFacebookIcon } from '@/lib/integrations/components/icons/facebook-icon';
import { SocialInstagramIcon } from '@/lib/integrations/components/icons/instagram';
import { SocialRedditIcon } from '@/lib/integrations/components/icons/reddit-icon';
import { SocialYouTubeIcon } from '@/lib/integrations/components/icons/youtube';
import { SocialTwitchIcon } from '@/lib/integrations/components/icons/twitch-icon';
import { SocialTikTokIcon } from '@/lib/integrations/components/icons/tiktok-icon';
import { SocialLinkedInIcon } from '@/lib/integrations/components/icons/linked-in-icon';

export const PLATFORM_ICONS: Record<
  SocialPlatform,
  { icon: LucideIcon; label: string }
> = {
  x: { icon: SocialXIcon, label: 'X (Twitter)' },
  facebook: { icon: SocialFacebookIcon, label: 'Facebook' },
  instagram: { icon: SocialInstagramIcon, label: 'Instagram' },
  discord: { icon: SocialDiscordIcon, label: 'Discord' },
  reddit: { icon: SocialRedditIcon, label: 'Reddit' },
  youtube: { icon: SocialYouTubeIcon, label: 'YouTube' },
  twitch: { icon: SocialTwitchIcon, label: 'Twitch' },
  tiktok: { icon: SocialTikTokIcon, label: 'TikTok' },
  linkedin: { icon: SocialLinkedInIcon, label: 'LinkedIn' },
  website: { icon: Globe, label: 'Website' }
};

interface SocialLinkIconProps {
  platform: SocialPlatform;
  url: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
}

export const SocialLinkIcon: React.FC<SocialLinkIconProps> = ({
  platform,
  url,
  size = 'md',
  variant = 'ghost',
  className
}) => {
  const platformData = PLATFORM_ICONS[platform];
  const Icon = platformData.icon;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn('rounded-full', className)}
      asChild
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={platformData.label}
      >
        <Icon className={sizeClasses[size]} />
      </a>
    </Button>
  );
};
