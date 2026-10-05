import { render } from '@testing-library/react';
import { SidebarProvider } from '@giveaway/ui-primitives/sidebar';
import { TeamsProvider } from '@giveaway/team-context/team-provider';
import { UserProvider } from '@giveaway/account-context/user-provider';
import { DetailedUserTeam } from '@giveaway/team-model/teams';
import { UserSchema } from '@giveaway/user-model/user';

export const acmeTeam: DetailedUserTeam = {
  id: 'team-acme',
  name: 'Acme',
  slug: 'acme',
  logo: '',
  memberCount: 3,
  tier: 'FREE',
  role: 'OWNER'
};

export const globexTeam: DetailedUserTeam = {
  id: 'team-globex',
  name: 'Globex',
  slug: 'globex',
  logo: 'https://cdn.example.com/globex.png',
  memberCount: 1,
  tier: 'PRO',
  role: 'MEMBER'
};

export const sidebarUser: UserSchema = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  emailVerified: true,
  image: null,
  countryCode: null,
  userAgent: null,
  birthday: null,
  qualityScore: 0,
  providers: [],
  source: 'SIGNUP',
  preferredContactMethod: null,
  accountType: 'HOST',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  isAnonymous: false
};

type SidebarRenderOptions = {
  activeTeam?: DetailedUserTeam;
  teams?: DetailedUserTeam[];
  user?: UserSchema;
  defaultOpen?: boolean;
};

export const renderInSidebar = (
  ui: React.ReactElement,
  {
    activeTeam = acmeTeam,
    teams = [acmeTeam, globexTeam],
    user = sidebarUser,
    defaultOpen = true
  }: SidebarRenderOptions = {}
) =>
  render(
    <UserProvider value={user}>
      <TeamsProvider value={{ activeTeam, teams }}>
        <SidebarProvider defaultOpen={defaultOpen}>{ui}</SidebarProvider>
      </TeamsProvider>
    </UserProvider>
  );
