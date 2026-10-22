import { beforeEach, describe, expect, it } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { e2eTemplatesRequestSchema } from '@giveaway/e2e-model/extras';
import {
  DEFAULT_TEMPLATE_CONTENT,
  DEFAULT_TEMPLATE_DESCRIPTION
} from '@giveaway/templates-model/defaults';
import { toStorableTemplateSchema } from '@giveaway/templates-model/schemas/template';
import { E2E_TEMPLATE_IMAGE, seedE2eTemplates } from '../templates';
import { e2eUser, realUser, teamRow } from './fixtures';

const db = asPrismaClient();

const seed = (templates: Record<string, unknown>[]) =>
  seedE2eTemplates({
    db,
    request: e2eTemplatesRequestSchema.parse({
      team: 'e2e-abc123-w0',
      templates
    })
  });

beforeEach(() => {
  prismaMock.team.findUnique.mockResolvedValue(
    teamRow({
      members: [
        { role: 'ADMIN', user: e2eUser('admin') },
        { role: 'OWNER', user: e2eUser('host') }
      ]
    })
  );
  prismaMock.template.create.mockImplementation((async (args: {
    data: { id: string; name: string };
  }) => ({ id: args.data.id, name: args.data.name })) as never);
});

describe('seedE2eTemplates', () => {
  it('creates each template from the editor defaults, as the owner of the team', async () => {
    const result = await seed([
      { name: 'Template A' },
      { name: 'Template B', description: 'About B' }
    ]);

    const { content } = toStorableTemplateSchema(
      DEFAULT_TEMPLATE_CONTENT({ sponsorName: 'e2e-abc123-w0' })
    );
    const withoutIds = (value: unknown) =>
      JSON.parse(JSON.stringify(value).replace(/"id":"[^"]*"/g, '"id":""'));
    expect(prismaMock.template.create).toHaveBeenNthCalledWith(1, {
      data: {
        id: expect.stringMatching(/^[\w-]{6}$/),
        name: 'Template A',
        description: DEFAULT_TEMPLATE_DESCRIPTION,
        image: E2E_TEMPLATE_IMAGE,
        content: expect.anything(),
        teamId: 'team-e2e-abc123-w0',
        createdById: 'user-host'
      },
      select: { id: true, name: true }
    });
    const [[first]] = prismaMock.template.create.mock.calls;
    expect(withoutIds(first.data.content)).toEqual(withoutIds(content));
    expect(prismaMock.template.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Template B',
          description: 'About B'
        })
      })
    );
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      team: 'e2e-abc123-w0',
      templates: [
        { id: expect.any(String), name: 'Template A' },
        { id: expect.any(String), name: 'Template B' }
      ]
    });
  });

  it('shows the image of the deployment, so the page loads nothing from another host', () => {
    expect(E2E_TEMPLATE_IMAGE).toBe('/logo.png');
  });

  it('refuses a team with a member who is not an e2e user, and writes nothing', async () => {
    prismaMock.team.findUnique.mockResolvedValue(
      teamRow({
        members: [
          { role: 'OWNER', user: e2eUser('host') },
          { role: 'MEMBER', user: realUser() }
        ]
      })
    );

    await expect(seed([{ name: 'T' }])).rejects.toMatchObject({
      code: 'FORBIDDEN'
    });
    expect(prismaMock.template.create).not.toHaveBeenCalled();
  });
});
