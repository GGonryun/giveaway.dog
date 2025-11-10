'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <div className="space-y-2">
        <Label htmlFor="team-slug" className="flex items-center gap-2">
          Slug
          <Lock className="h-3 w-3 text-muted-foreground" />
        </Label>
        <Input
          id="team-slug"
          value={slug}
          disabled
          className="font-mono text-sm"
        />
      </div>
    </SettingsCard>
  );
};
