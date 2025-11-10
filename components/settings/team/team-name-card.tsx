'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsCard } from '../settings-card';
import { useProcedure } from '@/lib/mrpc/hook';
import updateTeamName from '@/procedures/teams/update-team-name';
import { toast } from 'sonner';

interface TeamNameCardProps {
  slug: string;
  initialName: string;
  onUpdate?: () => void;
}

export const TeamNameCard: React.FC<TeamNameCardProps> = ({
  slug,
  initialName,
  onUpdate
}) => {
  const [name, setName] = useState(initialName);
  const hasChanges = name !== initialName && name.trim().length > 0;

  const { isLoading, run: saveName } = useProcedure({
    action: updateTeamName,
    onSuccess() {
      toast.success('Team name updated successfully');
      onUpdate?.();
    },
    onFailure(error) {
      toast.error(error.message);
    }
  });

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleSave = () => {
    if (!hasChanges) return;
    saveName({ slug, name: name.trim() });
  };

  return (
    <SettingsCard
      title="Team Name"
      description="The name of your team as it appears throughout the application."
      footerNote="Must be at least 1 character long."
      onSave={handleSave}
      isSaving={isLoading}
      hasChanges={hasChanges}
    >
      <div className="space-y-2">
        <Input
          id="team-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Team"
          maxLength={100}
        />
      </div>
    </SettingsCard>
  );
};
