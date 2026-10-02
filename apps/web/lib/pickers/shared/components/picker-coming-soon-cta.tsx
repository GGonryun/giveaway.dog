'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';
import { SocialTwitchIcon } from '@/lib/integrations/components/icons/twitch-icon';

interface PickerComingSoonCTAProps {
  slug: string;
  title: string;
  description: string;
  platform: 'discord' | 'twitch';
}

const PLATFORM_ICONS = {
  discord: SocialDiscordIcon,
  twitch: SocialTwitchIcon
} as const;

export const PickerComingSoonCTA: React.FC<PickerComingSoonCTAProps> = ({
  slug,
  title,
  description,
  platform
}) => {
  const Icon = PLATFORM_ICONS[platform];

  return (
    <div className="my-auto mx-auto flex items-center justify-center">
      <Card className="py-12">
        <CardContent>
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-muted">
                <Icon className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold">{title}</h2>
              <p className="text-muted-foreground text-lg">{description}</p>
            </div>

            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                We're working hard to bring you {title} pickers. Stay tuned for
                updates!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button asChild size="lg">
                  <Link href={`/app/${slug}/pickers`}>
                    View Available Pickers
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
