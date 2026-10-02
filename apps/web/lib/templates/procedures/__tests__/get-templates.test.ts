import { describe, it, expect } from 'vitest';
import { getTemplates } from '../get-templates';
import { STATIC_TEMPLATES } from '../../data/static-templates';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

const teamDetails = {
  name: 'Acme',
  slug: 'acme',
  logo: 'https://example.com/logo.png'
};

const storedTemplate = (
  id: string,
  name: string,
  description: string,
  createdBy: { id: string; name: string | null; image: string | null } = {
    id: 'creator-1',
    name: 'Creator',
    image: null
  }
) => ({
  id,
  name,
  description,
  image: 'https://example.com/tpl.png',
  type: 'SWEEPSTAKES',
  content: { setup: { name: `${name} setup` } },
  teamId: 'team-1',
  createdById: createdBy.id,
  createdBy
});

const teamWith = (templates: ReturnType<typeof storedTemplate>[]) => ({
  id: 'team-1',
  ...teamDetails,
  templates
});

const staticItem = (template: (typeof STATIC_TEMPLATES)[number]) => ({
  template,
  teamId: 'team-1',
  team: teamDetails,
  createdBy: {
    id: TEST_USER.id,
    name: TEST_USER.name,
    image: TEST_USER.image
  },
  isCustom: false
});

describe('getTemplates', () => {
  describe('authorization and input', () => {
    it('returns UNAUTHORIZED for signed-out callers', async () => {
      const result = await getTemplates({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('returns UNPROCESSABLE_CONTENT when the slug is missing', async () => {
      signIn();

      const result = await getTemplates(
        {} as unknown as Parameters<typeof getTemplates>[0]
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
    });

    it('returns UNPROCESSABLE_CONTENT for a non-string search', async () => {
      signIn();

      const result = await getTemplates({
        slug: 'acme',
        search: 5
      } as unknown as Parameters<typeof getTemplates>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('team lookup', () => {
    it('loads the caller team with its templates and their creators', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(teamWith([]));

      await getTemplates({ slug: 'acme' });

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: {
          slug: 'acme',
          members: { some: { userId: TEST_USER.id } }
        },
        include: {
          templates: {
            include: {
              createdBy: { select: { id: true, name: true, image: true } }
            }
          }
        }
      });
    });

    it('returns an empty list when the caller has no access to the team', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(null);

      expect(expectOk(await getTemplates({ slug: 'acme' }))).toEqual([]);
    });
  });

  describe('listing', () => {
    it('returns only the static templates when the team has none stored', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(teamWith([]));

      expect(expectOk(await getTemplates({ slug: 'acme' }))).toEqual(
        STATIC_TEMPLATES.map(staticItem)
      );
    });

    it('lists stored templates before static ones', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(
        teamWith([
          storedTemplate('tpl-1', 'Summer Sale', 'Hot deals'),
          storedTemplate('tpl-2', 'Winter Sale', 'Cold deals')
        ])
      );

      const data = expectOk(await getTemplates({ slug: 'acme' }));

      expect(data.map((item) => [item.template.id, item.isCustom])).toEqual([
        ['tpl-1', true],
        ['tpl-2', true],
        ['basic-giveaway', false],
        ['x-giveaway', false],
        ['anonymous-sweepstakes', false]
      ]);
    });

    it('describes a stored template with its creator and flattened content', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(
        teamWith([
          storedTemplate('tpl-1', 'Summer Sale', 'Hot deals', {
            id: 'creator-9',
            name: null,
            image: 'https://example.com/c.png'
          })
        ])
      );

      const [first] = expectOk(await getTemplates({ slug: 'acme' }));

      expect(first).toEqual({
        teamId: 'team-1',
        team: teamDetails,
        createdBy: {
          id: 'creator-9',
          name: null,
          image: 'https://example.com/c.png'
        },
        isCustom: true,
        template: {
          setup: { name: 'Summer Sale setup' },
          id: 'tpl-1',
          template: {
            name: 'Summer Sale',
            description: 'Hot deals',
            image: 'https://example.com/tpl.png'
          }
        }
      });
    });

    it('treats an empty search as no filter', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(teamWith([]));

      const data = expectOk(await getTemplates({ slug: 'acme', search: '' }));

      expect(data).toHaveLength(STATIC_TEMPLATES.length);
    });
  });

  describe('search', () => {
    const arrangeTeam = () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(
        teamWith([
          storedTemplate('tpl-1', 'Summer Sale', 'Hot deals'),
          storedTemplate('tpl-2', 'Winter Party', 'Cold drinks and sale')
        ])
      );
    };

    it('matches template names case-insensitively', async () => {
      arrangeTeam();

      const data = expectOk(
        await getTemplates({ slug: 'acme', search: 'SUMMER' })
      );

      expect(data.map((item) => item.template.id)).toEqual(['tpl-1']);
    });

    it('matches template descriptions', async () => {
      arrangeTeam();

      const data = expectOk(
        await getTemplates({ slug: 'acme', search: 'drinks' })
      );

      expect(data.map((item) => item.template.id)).toEqual(['tpl-2']);
    });

    it('matches template descriptions case-insensitively', async () => {
      arrangeTeam();

      const data = expectOk(
        await getTemplates({ slug: 'acme', search: 'cold' })
      );

      expect(data.map((item) => item.template.id)).toEqual(['tpl-2']);
    });

    it('keeps templates that match by either name or description', async () => {
      arrangeTeam();

      const data = expectOk(
        await getTemplates({ slug: 'acme', search: 'sale' })
      );

      expect(data.map((item) => item.template.id)).toEqual(['tpl-1', 'tpl-2']);
    });

    it('filters static templates too', async () => {
      arrangeTeam();

      const data = expectOk(
        await getTemplates({ slug: 'acme', search: 'anonymous' })
      );

      expect(data.map((item) => item.template.id)).toEqual([
        'anonymous-sweepstakes'
      ]);
    });

    it('does not search the sweepstakes setup content', async () => {
      arrangeTeam();

      const data = expectOk(
        await getTemplates({ slug: 'acme', search: 'Summer Sale setup' })
      );

      expect(data).toEqual([]);
    });

    it('returns an empty list when nothing matches', async () => {
      arrangeTeam();

      expect(
        expectOk(await getTemplates({ slug: 'acme', search: 'zzz' }))
      ).toEqual([]);
    });
  });

  describe('failures', () => {
    it('returns the VALIDATION_ERROR for a stored row with a non-string id', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(
        teamWith([
          {
            ...storedTemplate('tpl-1', 'Summer Sale', 'Hot deals'),
            id: 1 as unknown as string
          }
        ])
      );

      const result = await getTemplates({ slug: 'acme' });

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Template validation failed'
      );
    });

    it('returns UNPROCESSABLE_CONTENT when the team has no logo', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue({
        ...teamWith([]),
        logo: null
      });

      const result = await getTemplates({ slug: 'acme' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed: /
      );
    });

    it('maps a P2025 error to NOT_FOUND', async () => {
      signIn();
      prismaMock.team.findUnique.mockRejectedValue(knownRequestError('P2025'));

      const result = await getTemplates({ slug: 'acme' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
    });
  });
});
