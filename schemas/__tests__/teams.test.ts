import { describe, it, expect } from 'vitest';
import { TeamRole } from '@prisma/client';
import {
  GET_TEAM_SELECT,
  toDetailedUserTeam,
  detailedUserTeamSchema,
  createTeamInputSchema
} from '../teams';

type TeamPayload = Parameters<typeof toDetailedUserTeam>[1];

const team = (overrides: Partial<TeamPayload> = {}): TeamPayload => ({
  id: 'team-1',
  name: 'Acme',
  slug: 'acme',
  logo: 'https://example.com/logo.png',
  links: [{ platform: 'x', url: 'https://x.com/acme' }],
  tier: 'PRO',
  members: [
    { id: 'm-1', role: TeamRole.OWNER, userId: 'owner' },
    { id: 'm-2', role: TeamRole.ADMIN, userId: 'user-1' },
    { id: 'm-3', role: TeamRole.MEMBER, userId: 'user-3' }
  ],
  ...overrides
});

const messagesFor = (input: Record<string, unknown>) => {
  const result = createTeamInputSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
};

describe('GET_TEAM_SELECT', () => {
  it('selects the team fields and member roles', () => {
    expect(GET_TEAM_SELECT).toEqual({
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        links: true,
        tier: true,
        members: { select: { id: true, role: true, userId: true } }
      }
    });
  });
});

describe('toDetailedUserTeam', () => {
  it("maps the team with the user's role and member count", () => {
    expect(toDetailedUserTeam({ id: 'user-1' }, team())).toEqual({
      id: 'team-1',
      name: 'Acme',
      slug: 'acme',
      logo: 'https://example.com/logo.png',
      links: [{ platform: 'x', url: 'https://x.com/acme' }],
      tier: 'PRO',
      memberCount: 3,
      role: 'ADMIN'
    });
  });

  it('returns BLOCKED when the user is not a member', () => {
    expect(toDetailedUserTeam({ id: 'stranger' }, team()).role).toBe('BLOCKED');
  });

  it('returns BLOCKED and zero members for an empty team', () => {
    const result = toDetailedUserTeam({ id: 'user-1' }, team({ members: [] }));

    expect(result.role).toBe('BLOCKED');
    expect(result.memberCount).toBe(0);
  });

  it('uses the first matching membership when the user appears twice', () => {
    const result = toDetailedUserTeam(
      { id: 'user-1' },
      team({
        members: [
          { id: 'm-1', role: TeamRole.GUEST, userId: 'user-1' },
          { id: 'm-2', role: TeamRole.OWNER, userId: 'user-1' }
        ]
      })
    );

    expect(result.role).toBe('GUEST');
  });

  it('passes null links through', () => {
    expect(
      toDetailedUserTeam({ id: 'user-1' }, team({ links: null })).links
    ).toBeNull();
  });

  it('produces output that satisfies detailedUserTeamSchema', () => {
    expect(
      detailedUserTeamSchema.safeParse(
        toDetailedUserTeam({ id: 'user-1' }, team())
      ).success
    ).toBe(true);
  });
});

describe('detailedUserTeamSchema', () => {
  const detailed = {
    id: 'team-1',
    name: 'Acme',
    slug: 'acme',
    logo: 'logo.png',
    memberCount: 0,
    tier: 'FREE',
    role: 'MEMBER'
  };

  it('accepts a team without links', () => {
    expect(detailedUserTeamSchema.parse(detailed)).toEqual(detailed);
  });

  it('accepts any links value', () => {
    expect(
      detailedUserTeamSchema.parse({ ...detailed, links: { anything: 1 } })
        .links
    ).toEqual({ anything: 1 });
  });

  it('rejects a negative member count', () => {
    expect(
      detailedUserTeamSchema.safeParse({ ...detailed, memberCount: -1 }).success
    ).toBe(false);
  });

  it('rejects an unknown tier', () => {
    expect(
      detailedUserTeamSchema.safeParse({ ...detailed, tier: 'GOLD' }).success
    ).toBe(false);
  });

  it('rejects an unknown role', () => {
    expect(
      detailedUserTeamSchema.safeParse({ ...detailed, role: 'VIEWER' }).success
    ).toBe(false);
  });

  it('rejects a null logo', () => {
    expect(
      detailedUserTeamSchema.safeParse({ ...detailed, logo: null }).success
    ).toBe(false);
  });
});

describe('createTeamInputSchema', () => {
  describe('when the input is valid', () => {
    it('accepts a name and slug without a logo', () => {
      expect(
        createTeamInputSchema.parse({ name: 'Acme', slug: 'acme-2' })
      ).toEqual({ name: 'Acme', slug: 'acme-2' });
    });

    it('accepts a logo', () => {
      expect(
        createTeamInputSchema.parse({ name: 'Acme', slug: 'acme', logo: 'x' })
          .logo
      ).toBe('x');
    });

    it('accepts names and slugs of exactly 3 and 20 characters', () => {
      expect(messagesFor({ name: 'abc', slug: 'abc' })).toEqual([]);
      expect(
        messagesFor({ name: 'a'.repeat(20), slug: 'a'.repeat(20) })
      ).toEqual([]);
    });
  });

  describe('name rules', () => {
    it('rejects a two character name', () => {
      expect(messagesFor({ name: 'ab', slug: 'acme' })).toEqual([
        'Team name must be at least 3 characters'
      ]);
    });

    it('rejects a 21 character name', () => {
      expect(messagesFor({ name: 'a'.repeat(21), slug: 'acme' })).toEqual([
        'Team name must be less than 20 characters'
      ]);
    });

    it('trims the name after checking its length', () => {
      expect(
        createTeamInputSchema.parse({ name: '  ab  ', slug: 'acme' })
      ).toEqual({ name: 'ab', slug: 'acme' });
    });

    it('accepts a whitespace-only name and trims it to an empty string', () => {
      expect(
        createTeamInputSchema.parse({ name: '     ', slug: 'acme' }).name
      ).toBe('');
    });
  });

  describe('slug rules', () => {
    it('rejects a two character slug', () => {
      expect(messagesFor({ name: 'Acme', slug: 'ab' })).toEqual([
        'Team slug must be at least 3 characters'
      ]);
    });

    it('rejects a 21 character slug', () => {
      expect(messagesFor({ name: 'Acme', slug: 'a'.repeat(21) })).toEqual([
        'Team slug must be less than 20 characters'
      ]);
    });

    it.each(['Acme', 'acme_co', 'acme co', 'acmé'])(
      'rejects the slug %j',
      (slug) => {
        expect(messagesFor({ name: 'Acme', slug })).toEqual([
          'Team slug can only contain lowercase letters, numbers, and hyphens'
        ]);
      }
    );

    it('rejects surrounding whitespace because the regex runs before trimming', () => {
      expect(messagesFor({ name: 'Acme', slug: ' acme ' })).toEqual([
        'Team slug can only contain lowercase letters, numbers, and hyphens'
      ]);
    });
  });
});
