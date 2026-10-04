'use client';

import { useTeams } from '@giveaway/team-context/team-provider';
import { BasicInformationSection } from './basic-information-section';

export const TeamProfileSettings: React.FC = () => {
  const { activeTeam: team } = useTeams();

  return (
    <div className="space-y-6">
      <BasicInformationSection
        slug={team.slug}
        name={team.name}
        logo={team.logo}
      />
    </div>
  );
};
