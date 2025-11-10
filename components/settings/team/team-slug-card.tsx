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
      footerNote="Team slugs cannot be changed after creation."
      readOnly
    >
      <div className="space-y-2 flex items-center gap-2">
        <Input
          id="team-slug"
          value={slug}
          disabled
          className="font-mono text-sm"
        />
        <Lock className="h-5 w-5 mb-2 text-muted-foreground" />
      </div>
    </SettingsCard>
  );
};
