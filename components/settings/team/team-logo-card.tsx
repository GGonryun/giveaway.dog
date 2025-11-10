'use client';

import { useState, useEffect } from 'react';
import { SettingsCard } from '../settings-card';
import { useProcedure } from '@/lib/mrpc/hook';
import updateTeamLogo from '@/procedures/teams/update-team-logo';
import { toast } from 'sonner';
import { EmojiPickerComponent } from '@/components/patterns/emoji-picker';

interface TeamLogoCardProps {
  slug: string;
  initialLogo: string;
  onUpdate?: () => void;
}

export const TeamLogoCard: React.FC<TeamLogoCardProps> = ({
  slug,
  initialLogo,
  onUpdate
}) => {
  const [logo, setLogo] = useState(initialLogo);
  const hasChanges = logo !== initialLogo && logo.trim().length > 0;

  const { isLoading, run: saveLogo } = useProcedure({
    action: updateTeamLogo,
    onSuccess() {
      toast.success('Team logo updated successfully');
      onUpdate?.();
    },
    onFailure(error) {
      toast.error(error.message);
    }
  });

  useEffect(() => {
    setLogo(initialLogo);
  }, [initialLogo]);

  const handleSave = () => {
    if (!hasChanges) return;
    saveLogo({ slug, logo: logo.trim() });
  };

  return (
    <SettingsCard
      title="Team Logo"
      description="An emoji to represent your team."
      footerNote="Click the button to choose an emoji."
      onSave={handleSave}
      isSaving={isLoading}
      hasChanges={hasChanges}
    >
      <EmojiPickerComponent
        value={logo}
        onEmojiSelect={setLogo}
        title="Current Logo"
        description="Select an emoji to represent your team"
      />
    </SettingsCard>
  );
};
