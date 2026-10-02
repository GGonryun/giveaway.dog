'use client';

import { Input } from '@/components/ui/input';
import { SettingsCard } from '../settings-card';
import { Lock } from 'lucide-react';

interface TeamSlugCardProps {
  slug: string;
}

export const TeamSlugCard: React.FC<TeamSlugCardProps> = ({ slug }) => {
  return (
    <SettingsCard
      title="Team Slug"
      description="The unique identifier for your team in URLs."
      footer="Team slugs cannot be changed after creation."
    >
      <div className="flex items-center gap-2">
        <Input
          id="team-slug"
          value={slug}
          disabled
          className="font-mono text-sm"
        />
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
    </SettingsCard>
  );
};
