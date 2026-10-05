import { describe, it, expect } from 'vitest';
import { getTemplateForm } from '../get-template-form';
import { STATIC_TEMPLATES } from '@giveaway/templates-model/data/static-templates';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

const team = {
  id: 'team-1',
  name: 'Acme',
  slug: 'acme',
  logo: 'https://example.com/logo.png'
};

const dbTemplate = {
  id: 'tpl-1',
  name: 'Launch Party',
  description: 'Celebrate our launch',
  image: 'https://example.com/launch.png',
  type: 'SWEEPSTAKES',
  content: { setup: { name: 'Launch' }, tasks: [] },
  teamId: 'team-1',
  createdById: 'creator-1',
  createdBy: { id: 'creator-1', name: 'Creator', image: null }
};

const input = { templateId: 'tpl-1', slug: 'acme' };

describe('getTemplateForm', () => {
  describe('authorization and input', () => {
    it('returns UNAUTHORIZED for signed-out callers', async () => {
      const result = await getTemplateForm(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('returns UNPROCESSABLE_CONTENT when the template id is missing', async () => {
      signIn();

      const result = await getTemplateForm({
        slug: 'acme'
      } as unknown as Parameters<typeof getTemplateForm>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('team access', () => {
    it('looks up the team by slug among the caller memberships', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.findUnique.mockResolvedValue(dbTemplate);

      await getTemplateForm(input);

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: {
          slug: 'acme',
          members: { some: { userId: TEST_USER.id } }
        }
      });
    });

    it('returns NOT_FOUND when the caller is not on the team', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await getTemplateForm(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Team not found or you do not have access to it.'
      );
      expect(prismaMock.template.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the template is stored for the team', () => {
    it('queries the template scoped to the team with its creator', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.findUnique.mockResolvedValue(dbTemplate);

      await getTemplateForm(input);

      expect(prismaMock.template.findUnique).toHaveBeenCalledWith({
        where: { id: 'tpl-1', teamId: 'team-1' },
        include: {
          createdBy: { select: { id: true, name: true, image: true } }
        }
      });
    });

    it('returns the flattened template with team and creator details', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.findUnique.mockResolvedValue(dbTemplate);

      const data = expectOk(await getTemplateForm(input));

      expect(data).toEqual({
        setup: { name: 'Launch' },
        tasks: [],
        id: 'tpl-1',
        template: {
          name: 'Launch Party',
          description: 'Celebrate our launch',
          image: 'https://example.com/launch.png'
        },
        teamId: 'team-1',
        team: {
          name: 'Acme',
          slug: 'acme',
          logo: 'https://example.com/logo.png'
        },
        createdBy: { id: 'creator-1', name: 'Creator', image: null },
        isCustom: true
      });
    });

    it('does not fall back to static templates', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.findUnique.mockResolvedValue({
        ...dbTemplate,
        id: 'basic-giveaway'
      });

      const data = expectOk(
        await getTemplateForm({ templateId: 'basic-giveaway', slug: 'acme' })
      );

      expect(data).toMatchObject({ isCustom: true, setup: { name: 'Launch' } });
    });
  });

  describe('when the template is static', () => {
    it('returns the static template with the caller as creator', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.findUnique.mockResolvedValue(null);

      const data = expectOk(
        await getTemplateForm({ templateId: 'x-giveaway', slug: 'acme' })
      );

      expect(data).toEqual({
        ...STATIC_TEMPLATES[1],
        teamId: 'team-1',
        team: {
          name: 'Acme',
          slug: 'acme',
          logo: 'https://example.com/logo.png'
        },
        createdBy: {
          id: TEST_USER.id,
          name: TEST_USER.name,
          image: TEST_USER.image
        },
        isCustom: false
      });
    });

    it('returns NOT_FOUND when no stored or static template matches', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.findUnique.mockResolvedValue(null);

      const result = await getTemplateForm({
        templateId: 'missing',
        slug: 'acme'
      });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Template not found or you do not have access to it.'
      );
    });
  });

  describe('when the stored row is malformed', () => {
    it('returns the VALIDATION_ERROR raised while converting it', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.findUnique.mockResolvedValue({
        ...dbTemplate,
        id: 42
      });

      const result = await getTemplateForm(input);

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Template validation failed'
      );
    });
  });

  describe('when the database fails', () => {
    it('maps a P2025 error to NOT_FOUND', async () => {
      signIn();
      prismaMock.team.findUnique.mockRejectedValue(knownRequestError('P2025'));

      const result = await getTemplateForm(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
    });
  });
});
