'use client';

import { useState, useEffect } from 'react';
import { SettingsCard } from '../settings-card';
import { useProcedure } from '@/lib/mrpc/hook';
import updateTeamLogo from '@/procedures/teams/update-team-logo';
import { toast } from 'sonner';
import { FileUpload } from '@/components/ui/file-upload';

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
      description="An image to represent your team."
      footerNote="Upload an image file (JPEG, PNG, or GIF) up to 3MB."
      onSave={handleSave}
      isSaving={isLoading}
      hasChanges={hasChanges}
    >
      <FileUpload
        initialUrl={logo}
        onUpload={setLogo}
        size="md"
        className="items-start"
      />
    </SettingsCard>
  );
};
