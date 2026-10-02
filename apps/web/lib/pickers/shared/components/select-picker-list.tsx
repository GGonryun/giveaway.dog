'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { ChevronRight, GemIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';
import { SocialTwitchIcon } from '@/lib/integrations/components/icons/twitch-icon';
import { useTeams } from '@/components/context/team-provider';

interface SelectPickerListProps {
  slug: string;
}

interface PickerListOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
}

export const SelectPickerList: React.FC<SelectPickerListProps> = ({ slug }) => {
  const router = useRouter();
  const { activeTeam } = useTeams();

  const isFreeTier = activeTeam.tier === 'FREE';

  const PICKER_LIST_OPTIONS: PickerListOption[] = [
    {
      id: 'x',
      title: 'X',
      description: 'Modern X picker powered by Twitter 2.0 API.',
      icon: SocialXIcon,
      path: 'x',
      badge: isFreeTier ? 'Pro only' : undefined
    },
    {
      id: 'discord',
      title: 'Discord',
      description: 'Discord pickers for server-based giveaways.',
      icon: SocialDiscordIcon,
      path: 'discord',
      badge: 'Coming Soon'
    },
    {
      id: 'twitch',
      title: 'Twitch',
      description: 'Twitch pickers for stream-based giveaways.',
      icon: SocialTwitchIcon,
      path: 'twitch',
      badge: 'Coming Soon'
    }
  ];

  const handleNavigate = (path: string) => {
    router.push(`/app/${slug}/pickers/${path}`);
  };

  return (
    <div className="space-y-4">
      {PICKER_LIST_OPTIONS.map((option) => {
        const Icon = option.icon;

        return (
          <Card
            key={option.id}
            className="p-6 hover:border-primary transition-colors cursor-pointer relative"
            onClick={() => handleNavigate(option.path)}
          >
            {option.badge && (
              <Badge
                className="absolute top-4 right-4"
                variant={option.badge === 'Pro only' ? 'default' : 'secondary'}
              >
                {option.badge === 'Pro only' && (
                  <GemIcon className="w-3 h-3 mr-1" />
                )}
                {option.badge}
              </Badge>
            )}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold mb-1">{option.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
              {!option.badge && (
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
