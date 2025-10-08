import React from 'react';
import { Mail } from 'lucide-react';
import { ProviderTypeSchema } from '@/schemas/user';
import { cn } from '@/lib/utils';
import { SocialXIcon } from './x-icon';
import { SocialGoogleIcon } from './google-icon';
import { SocialDiscordIcon } from './discord-icon';
import { assertNever } from '@/lib/errors';

interface ProviderIconProps {
  type: ProviderTypeSchema;
  className?: string;
}

export const ProviderIcon: React.FC<ProviderIconProps> = ({
  type,
  className = 'w-4 h-4'
}) => {
  let IconComponent;
  switch (type) {
    case 'twitter':
      IconComponent = SocialXIcon;
      break;
    case 'google':
      IconComponent = SocialGoogleIcon;
      break;
    case 'discord':
      IconComponent = SocialDiscordIcon;
      break;
    case 'email':
      IconComponent = Mail;
      break;
    default:
      throw assertNever(type);
  }

  return <IconComponent className={cn(className)} />;
};
