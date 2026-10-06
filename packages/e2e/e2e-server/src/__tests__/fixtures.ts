export const NOW = new Date('2026-10-06T12:00:00.000Z');

type FixtureUser = {
  id: string;
  email: string | null;
  name: string;
  image: string | null;
  username: string | null;
  onboarded: boolean;
  accountType: string;
};

export const e2eUser = (persona: string, ns = 'abc123'): FixtureUser => ({
  id: `user-${persona}`,
  email: `e2e-${persona}-${ns}@example.com`,
  name: `E2E ${persona}`,
  image: null,
  username: null,
  onboarded: true,
  accountType: 'HOST'
});

export const realUser = (): FixtureUser => ({
  id: 'user-real',
  email: 'someone@gmail.com',
  name: 'Someone',
  image: null,
  username: 'someone',
  onboarded: true,
  accountType: 'HOST'
});

type Member = { role: string; user: FixtureUser };

export const teamRow = ({
  slug = 'e2e-abc123-w0',
  members = [{ role: 'OWNER', user: e2eUser('host') }]
}: { slug?: string; members?: Member[] } = {}) => ({
  id: `team-${slug}`,
  slug,
  name: slug,
  tier: 'FREE',
  createdAt: NOW,
  members
});
