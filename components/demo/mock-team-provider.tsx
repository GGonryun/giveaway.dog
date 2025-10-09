'use client';

import { TeamsProvider } from '@/components/context/team-provider';
import { DetailedUserTeam } from '@/schemas/teams';
import { TeamRole } from '@prisma/client';

const MOCK_TEAM: DetailedUserTeam = {
  id: 'demo-team-id',
  name: 'Demo Team',
  slug: 'demo-team',
  logo: '🎮',
  memberCount: 1,
  role: TeamRole.OWNER
};

export function MockTeamProvider({ children }: { children: React.ReactNode }) {
  return (
    <TeamsProvider value={{ activeTeam: MOCK_TEAM, teams: [MOCK_TEAM] }}>
      {children}
    </TeamsProvider>
  );
}
