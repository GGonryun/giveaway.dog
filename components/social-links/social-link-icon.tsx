import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Globe,
  MessageCircle,
  Video,
  type LucideIcon
} from 'lucide-react';
import { type SocialPlatform } from '@/schemas/social-links';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SocialXIcon } from '../../lib/integrations/components/icons/x-icon';
import { SocialDiscordIcon } from '../../lib/integrations/components/icons/discord-icon';

export const PLATFORM_ICONS: Record<
  SocialPlatform,
  { icon: LucideIcon; label: string }
> = {
  x: { icon: SocialXIcon, label: 'X (Twitter)' },
  facebook: { icon: Facebook, label: 'Facebook' },
  instagram: { icon: Instagram, label: 'Instagram' },
  discord: { icon: SocialDiscordIcon, label: 'Discord' },
  reddit: { icon: MessageCircle, label: 'Reddit' },
  youtube: { icon: Youtube, label: 'YouTube' },
  twitch: { icon: Video, label: 'Twitch' },
  tiktok: { icon: Video, label: 'TikTok' },
  linkedin: { icon: Linkedin, label: 'LinkedIn' },
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
