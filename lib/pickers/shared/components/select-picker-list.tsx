'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';

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
  disabled?: boolean;
}

const PICKER_LIST_OPTIONS: PickerListOption[] = [
  {
    id: 'twitter',
    title: 'Twitter (Legacy)',
    description:
      'Legacy X (Twitter) pickers with full API integration support.',
    icon: SocialXIcon,
    path: 'twitter'
  },
  {
    id: 'x',
    title: 'X',
    description: 'Modern X picker powered by Twitter 2.0 API.',
    icon: SocialXIcon,
    path: 'x'
  },
  {
    id: 'discord',
    title: 'Discord',
    description: 'Discord pickers for server-based giveaways.',
    icon: SocialDiscordIcon,
    path: 'discord',
    badge: 'Coming Soon',
    disabled: true
  }
];

export const SelectPickerList: React.FC<SelectPickerListProps> = ({ slug }) => {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(`/app/${slug}/pickers/${path}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-4">
        {PICKER_LIST_OPTIONS.map((option) => {
          const Icon = option.icon;

          return (
            <Card
              key={option.id}
              className={cn(
                'p-6 hover:border-primary transition-colors cursor-pointer relative',
                option.disabled && 'opacity-60 cursor-not-allowed'
              )}
              onClick={() => !option.disabled && handleNavigate(option.path)}
            >
              {option.badge && (
                <Badge className="absolute top-4 right-4" variant="secondary">
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
                {!option.disabled && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
