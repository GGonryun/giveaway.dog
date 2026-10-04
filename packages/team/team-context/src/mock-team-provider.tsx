'use client';

import { TeamsProvider } from './team-provider';
import { DetailedUserTeam } from '@giveaway/team-model/teams';
import { TeamRole, TeamTier } from '@giveaway/db-model';

const MOCK_TEAM: DetailedUserTeam = {
  id: 'demo-team-id',
  name: 'Demo Team',
  slug: 'demo-team',
  logo: '🎮',
  memberCount: 1,
  role: TeamRole.OWNER,
  tier: TeamTier.ALPHA
};

export function MockTeamProvider({ children }: { children: React.ReactNode }) {
  return (
    <TeamsProvider value={{ activeTeam: MOCK_TEAM, teams: [MOCK_TEAM] }}>
      {children}
    </TeamsProvider>
  );
}
