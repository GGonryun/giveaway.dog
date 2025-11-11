'use client';

import { useTeams } from '@/components/context/team-provider';
import { SocialLinksCard } from '@/components/settings/team/social-links-card';
import { useRouter } from 'next/navigation';
import { socialLinksSchema, type SocialLink } from '@/schemas/social-links';

interface SocialsSettingsProps {
  slug: string;
}

export const SocialsSettings: React.FC<SocialsSettingsProps> = ({ slug }) => {
  const { activeTeam: team } = useTeams();
  const router = useRouter();

  const handleUpdate = () => {
    router.refresh();
  };

  const parsedLinks = (() => {
    if (!team.links) return [];

    try {
      const parsed = socialLinksSchema.safeParse(team.links);
      return parsed.success ? parsed.data : [];
    } catch {
      return [];
    }
  })();

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
