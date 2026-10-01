import { describe, it, expect, beforeEach } from 'vitest';
import createTeam from '../create-team';
import { DEFAULT_TEAM_LOGO } from '@/lib/team/data';
import { MAX_USER_TEAMS } from '@/lib/settings';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

type CreateTeamInput = Parameters<typeof createTeam>[0];

const validInput = (overrides: Partial<CreateTeamInput> = {}) => ({
  name: 'Acme Team',
  slug: 'acme-1',
  ...overrides
});

const createdTeam = (overrides: Record<string, unknown> = {}) => ({
  id: 'team-1',
  name: 'Acme Team',
  slug: 'acme-1',
  logo: DEFAULT_TEAM_LOGO,
  links: null,
  tier: 'FREE',
  ...overrides
});

describe('createTeam', () => {
  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await createTeam(validInput());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.membership.count).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      signIn();
    });

    it.each([
      [
        'a name shorter than 3 characters',
        { name: 'ab' },
        'Team name must be at least 3 characters'
      ],
      [
        'a name longer than 20 characters',
        { name: 'a'.repeat(21) },
        'Team name must be less than 20 characters'
      ],
      [
        'a slug shorter than 3 characters',
        { slug: 'ab' },
        'Team slug must be at least 3 characters'
      ],
      [
        'a slug longer than 20 characters',
        { slug: 'a'.repeat(21) },
        'Team slug must be less than 20 characters'
      ],
      [
        'a slug with uppercase letters',
        { slug: 'Acme' },
        'Team slug can only contain lowercase letters, numbers, and hyphens'
      ],
      [
        'a slug with underscores',
        { slug: 'acme_team' },
        'Team slug can only contain lowercase letters, numbers, and hyphens'
      ],
      [
        'a slug with surrounding spaces',
        { slug: ' acme ' },
        'Team slug can only contain lowercase letters, numbers, and hyphens'
      ]
    ])('rejects %s', async (_label, overrides, message) => {
      const result = await createTeam(validInput(overrides));

      const failure = expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(failure.message).toContain('Input validation failed');
      expect(failure.message).toContain(message);
      expect(prismaMock.team.create).not.toHaveBeenCalled();
    });

    it('rejects a non-string logo', async () => {
      const result = await createTeam({
        ...validInput(),
        logo: 1
      } as unknown as CreateTeamInput);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('rejects a missing name', async () => {
      const result = await createTeam({
        slug: 'acme'
      } as unknown as CreateTeamInput);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });

  describe('when the caller is under the team limit', () => {
    beforeEach(() => {
      signIn();
      prismaMock.membership.count.mockResolvedValue(0);
      prismaMock.team.findFirst.mockResolvedValue(null);
      prismaMock.team.create.mockImplementation(
        async ({ data }: { data: Record<string, unknown> }) =>
          createdTeam({ name: data.name, slug: data.slug, logo: data.logo })
      );
    });

    it('returns the created team record', async () => {
      const result = await createTeam(validInput());

      expect(expectOk(result)).toEqual(createdTeam());
    });

    it('counts the memberships of the caller', async () => {
      await createTeam(validInput());

      expect(prismaMock.membership.count).toHaveBeenCalledWith({
        where: { userId: TEST_USER.id }
      });
    });

    it('checks whether the slug is already taken', async () => {
      await createTeam(validInput());

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: { slug: 'acme-1' }
      });
    });

    it('creates the team with the caller as OWNER and the default logo', async () => {
      await createTeam(validInput());

      expect(prismaMock.team.create).toHaveBeenCalledWith({
        data: {
          name: 'Acme Team',
          slug: 'acme-1',
          logo: DEFAULT_TEAM_LOGO,
          members: { create: { userId: TEST_USER.id, role: 'OWNER' } }
        }
      });
    });

    it('uses the provided logo', async () => {
      await createTeam(validInput({ logo: 'https://example.com/logo.png' }));

      expect(prismaMock.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            logo: 'https://example.com/logo.png'
          })
        })
      );
    });

    it('keeps an empty-string logo instead of falling back to the default', async () => {
      await createTeam(validInput({ logo: '' }));

      expect(prismaMock.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ logo: '' })
        })
      );
    });

    it('allows creating a team at one below the limit', async () => {
      prismaMock.membership.count.mockResolvedValue(MAX_USER_TEAMS - 1);

      const result = await createTeam(validInput());

      expectOk(result);
      expect(prismaMock.team.create).toHaveBeenCalledTimes(1);
    });

    it('accepts a 3 character name and a 20 character slug', async () => {
      const result = await createTeam({ name: 'abc', slug: 'a'.repeat(20) });

      expectOk(result);
    });

    it('accepts a 20 character name and a 3 character slug of digits and hyphens', async () => {
      const result = await createTeam({ name: 'n'.repeat(20), slug: '0-9' });

      expectOk(result);
    });

    it('trims the name after the length checks', async () => {
      await createTeam(validInput({ name: '  ab ' }));

      expect(prismaMock.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'ab' })
        })
      );
    });

    it('rejects a name that only exceeds 20 characters because of padding', async () => {
      const result = await createTeam(
        validInput({ name: `${'n'.repeat(19)}  ` })
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('fails output validation when the created record has no slug', async () => {
      prismaMock.team.create.mockResolvedValue({ id: 'team-1' });

      const result = await createTeam(validInput());

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Output validation failed'
      );
    });
  });

  describe('when the caller has reached the team limit', () => {
    beforeEach(() => {
      signIn();
      prismaMock.membership.count.mockResolvedValue(MAX_USER_TEAMS);
    });

    it('returns FORBIDDEN with the limit in the message', async () => {
      const result = await createTeam(validInput());

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You cannot be a member of more than 5 teams'
      );
    });

    it('does not look up the slug or create a team', async () => {
      await createTeam(validInput());

      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.team.create).not.toHaveBeenCalled();
    });

    it('also refuses callers above the limit', async () => {
      prismaMock.membership.count.mockResolvedValue(MAX_USER_TEAMS + 3);

      const result = await createTeam(validInput());

      expectFailure(result, 'FORBIDDEN');
    });
  });

  describe('when the slug is already taken', () => {
    beforeEach(() => {
      signIn();
      prismaMock.membership.count.mockResolvedValue(1);
      prismaMock.team.findFirst.mockResolvedValue({ id: 'existing' });
    });

    it('returns CONFLICT', async () => {
      const result = await createTeam(validInput());

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'This team slug is already taken'
      );
    });

    it('does not create a team', async () => {
      await createTeam(validInput());

      expect(prismaMock.team.create).not.toHaveBeenCalled();
    });
  });

  describe('when the database rejects the insert', () => {
    beforeEach(() => {
      signIn();
      prismaMock.membership.count.mockResolvedValue(0);
      prismaMock.team.findFirst.mockResolvedValue(null);
    });

    it('maps a unique constraint race to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.team.create.mockRejectedValue(knownRequestError('P2002'));

      const result = await createTeam(validInput());

      expectFailure(result, 'INTERNAL_SERVER_ERROR');
    });
  });
});
