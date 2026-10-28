'use client';

import { useMemo } from 'react';
import { useTeams } from '@giveaway/team-context/team-provider';
import { SocialLinksCard } from './social-links-card';
import { useRouter } from 'next/navigation';
import { socialLinksSchema } from '@giveaway/team-model/social-links';

interface SocialsSettingsProps {
  slug: string;
}

export const SocialsSettings: React.FC<SocialsSettingsProps> = ({ slug }) => {
  const { activeTeam: team } = useTeams();
  const router = useRouter();

  const handleUpdate = () => {
    router.refresh();
  };

  const parsedLinks = useMemo(() => {
    if (!team.links) return [];

    try {
      const parsed = socialLinksSchema.safeParse(team.links);
      return parsed.success ? parsed.data : [];
    } catch {
      return [];
    }
  }, [team.links]);

  return (
    <div className="space-y-6">
      <SocialLinksCard
        slug={slug}
        initialLinks={parsedLinks}
        onUpdate={handleUpdate}
      />
    </div>
  );
};
