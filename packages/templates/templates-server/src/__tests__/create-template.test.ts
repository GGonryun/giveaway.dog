import { describe, it, expect } from 'vitest';
import { createTemplate } from '../create-template';
import { getTemplateById } from '@giveaway/templates-model/data/static-templates';
import {
  DEFAULT_TEMPLATE_CONTENT,
  DEFAULT_TEMPLATE_DESCRIPTION,
  DEFAULT_TEMPLATE_IMAGE,
  DEFAULT_TEMPLATE_NAME
} from '@giveaway/templates-model/defaults';
import { toStorableTemplateSchema } from '@giveaway/templates-model/schemas/template';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';

const NANOID_6 = /^[A-Za-z0-9_-]{6}$/;
const NANOID_21 = /^[A-Za-z0-9_-]{21}$/;

const team = {
  id: 'team-1',
  name: 'Acme Inc',
  slug: 'acme',
  logo: 'https://example.com/logo.png'
};

type CreateArgs = {
  data: {
    id: string;
    name: string;
    description: string;
    image: string;
    teamId: string;
    createdById: string;
    content: Record<string, unknown> & {
      tasks?: { id: string; type: string }[];
      prizes?: { id: string }[];
      audience?: { formFields?: { id: string; type?: string }[] };
      terms?: { sponsorName?: string };
    };
  };
};

const createdArgs = (): CreateArgs => {
  const [args] = prismaMock.template.create.mock.calls[0];
  return args as CreateArgs;
};

const echoCreate = () => {
  prismaMock.template.create.mockImplementation(
    async ({ data }: CreateArgs) => ({
      ...data,
      type: 'SWEEPSTAKES',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z')
    })
  );
};

const storedTemplate = {
  id: 'tpl-db',
  name: 'Summer Sale',
  description: 'Hot deals',
  image: 'https://example.com/summer.png',
  type: 'SWEEPSTAKES',
  teamId: 'team-1',
  createdById: 'creator-1',
  content: {
    setup: { name: 'Summer', description: 'Win', banner: '' },
    tasks: [
      { id: 'task-a', type: 'BONUS_TASK', title: 'Bonus' },
      { id: 'task-b', type: 'VISIT_URL', title: 'Visit' }
    ],
    prizes: [{ id: 'prize-a', name: 'Shirt', quota: 1 }],
    audience: {
      allowedIdentities: ['TWITTER'],
      formFields: [{ id: 'field-a', type: 'EMAIL', label: 'Email' }]
    },
    terms: { type: 'TEMPLATE', sponsorName: 'Summer Co' },
    timing: { timeZone: 'UTC' }
  }
};

describe('createTemplate', () => {
  describe('authorization and input', () => {
    it('returns UNAUTHORIZED for signed-out callers', async () => {
      const result = await createTemplate({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('returns UNPROCESSABLE_CONTENT when the slug is missing', async () => {
      signIn();

      const result = await createTemplate(
        {} as unknown as Parameters<typeof createTemplate>[0]
      );

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
      echoCreate();

      await createTemplate({ slug: 'acme' });

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

      const result = await createTemplate({ slug: 'acme' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Team not found or you do not have access.'
      );
      expect(prismaMock.template.create).not.toHaveBeenCalled();
    });
  });

  describe('when creating a blank template', () => {
    it('stores the default settings for the team and caller', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      echoCreate();

      await createTemplate({ slug: 'acme' });

      const { data } = createdArgs();
      expect(data).toMatchObject({
        name: DEFAULT_TEMPLATE_NAME,
        description: DEFAULT_TEMPLATE_DESCRIPTION,
        image: DEFAULT_TEMPLATE_IMAGE,
        teamId: 'team-1',
        createdById: TEST_USER.id
      });
      expect(data.id).toMatch(NANOID_6);
    });

    it('stores every default content section', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      echoCreate();

      await createTemplate({ slug: 'acme' });

      expect(Object.keys(createdArgs().data.content).sort()).toEqual([
        'audience',
        'criteria',
        'design',
        'prizes',
        'setup',
        'tasks',
        'terms',
        'visibility'
      ]);
    });

    it('stores the default template content', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      echoCreate();
      const expected = toStorableTemplateSchema(
        DEFAULT_TEMPLATE_CONTENT({ sponsorName: 'Acme Inc' })
      ).content;

      await createTemplate({ slug: 'acme' });

      expect(createdArgs().data.content).toEqual({
        ...expected,
        audience: {
          ...expected.audience,
          formFields: expected.audience?.formFields?.map((field) => ({
            ...field,
            id: expect.any(String)
          }))
        }
      });
    });

    it('uses the team name as the sponsor name', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      echoCreate();

      await createTemplate({ slug: 'acme' });

      expect(createdArgs().data.content.terms).toMatchObject({
        sponsorName: 'Acme Inc'
      });
    });

    it('does not look up a source template', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      echoCreate();

      await createTemplate({ slug: 'acme' });

      expect(prismaMock.template.findFirst).not.toHaveBeenCalled();
    });

    it('treats an empty source template id as a blank template', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      echoCreate();

      await createTemplate({ slug: 'acme', sourceTemplateId: '' });

      expect(prismaMock.template.findFirst).not.toHaveBeenCalled();
      expect(createdArgs().data.name).toBe(DEFAULT_TEMPLATE_NAME);
    });

    it('returns only the id of the created record', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      echoCreate();

      const data = expectOk(await createTemplate({ slug: 'acme' }));

      expect(data).toStrictEqual({ id: createdArgs().data.id });
    });

    it('does not revalidate any cache tags', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      echoCreate();

      await createTemplate({ slug: 'acme' });

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('when copying a static template', () => {
    it('stores a copy named after the source without querying the database', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      echoCreate();

      await createTemplate({ slug: 'acme', sourceTemplateId: 'x-giveaway' });

      expect(prismaMock.template.findFirst).not.toHaveBeenCalled();
      expect(createdArgs().data).toMatchObject({
        name: 'X Engagement (Copy)',
        description: 'Encourage participants to engage on social media (X)',
        image:
          'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/aef1ff49-0e3b-4954-8a6b-16036cbc798b.png',
        teamId: 'team-1',
        createdById: TEST_USER.id
      });
      expect(createdArgs().data.id).toMatch(NANOID_6);
    });

    it('copies the content with freshly generated task ids', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      echoCreate();
      const source = getTemplateById('x-giveaway');
      const sourceIds = source?.tasks.map((task) => task.id) ?? [];

      await createTemplate({ slug: 'acme', sourceTemplateId: 'x-giveaway' });

      const tasks = createdArgs().data.content.tasks ?? [];
      expect(tasks.map((task) => task.type)).toEqual([
        'TWITTER_CONNECT',
        'TWITTER_FOLLOW',
        'TWITTER_RETWEET',
        'BONUS_TASK'
      ]);
      for (const task of tasks) {
        expect(task.id).toMatch(NANOID_21);
        expect(sourceIds).not.toContain(task.id);
      }
    });

    it('keeps the source visibility and terms', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      echoCreate();
      const source = getTemplateById('basic-giveaway');

      await createTemplate({
        slug: 'acme',
        sourceTemplateId: 'basic-giveaway'
      });

      expect(createdArgs().data.content).toMatchObject({
        visibility: source?.visibility,
        terms: source?.terms,
        setup: source?.setup
      });
    });

    it('returns only the id of the created copy', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      echoCreate();

      const data = expectOk(
        await createTemplate({ slug: 'acme', sourceTemplateId: 'x-giveaway' })
      );

      expect(data).toStrictEqual({ id: createdArgs().data.id });
    });

    it('leaves the static template untouched', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      echoCreate();
      const source = getTemplateById('x-giveaway');
      const before = structuredClone(source);

      await createTemplate({ slug: 'acme', sourceTemplateId: 'x-giveaway' });

      expect(source).toEqual(before);
    });
  });

  describe('when copying a stored template', () => {
    it('looks the source up within the team', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.findFirst.mockResolvedValue(storedTemplate);
      echoCreate();

      await createTemplate({ slug: 'acme', sourceTemplateId: 'tpl-db' });

      expect(prismaMock.template.findFirst).toHaveBeenCalledWith({
        where: { id: 'tpl-db', teamId: 'team-1' }
      });
    });

    it('returns NOT_FOUND when the source is not in the team', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.findFirst.mockResolvedValue(null);

      const result = await createTemplate({
        slug: 'acme',
        sourceTemplateId: 'tpl-db'
      });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Template not found or you do not have access.'
      );
      expect(prismaMock.template.create).not.toHaveBeenCalled();
    });

    it('stores a renamed copy with the source settings', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.findFirst.mockResolvedValue(storedTemplate);
      echoCreate();

      await createTemplate({ slug: 'acme', sourceTemplateId: 'tpl-db' });

      const { data } = createdArgs();
      expect(data).toMatchObject({
        name: 'Summer Sale (Copy)',
        description: 'Hot deals',
        image: 'https://example.com/summer.png',
        teamId: 'team-1',
        createdById: TEST_USER.id
      });
      expect(data.id).not.toBe('tpl-db');
      expect(data.id).toMatch(NANOID_6);
    });

    it('regenerates every nested id in the copied content', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.findFirst.mockResolvedValue(storedTemplate);
      echoCreate();

      await createTemplate({ slug: 'acme', sourceTemplateId: 'tpl-db' });

      const { content } = createdArgs().data;
      const ids = [
        ...(content.tasks ?? []).map((task) => task.id),
        ...(content.prizes ?? []).map((prize) => prize.id),
        ...(content.audience?.formFields ?? []).map((field) => field.id)
      ];
      expect(ids).toHaveLength(4);
      for (const id of ids) {
        expect(id).toMatch(NANOID_21);
      }
      for (const original of ['task-a', 'task-b', 'prize-a', 'field-a']) {
        expect(ids).not.toContain(original);
      }
      expect(new Set(ids).size).toBe(4);
    });

    it('keeps the copied values other than ids', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.findFirst.mockResolvedValue(storedTemplate);
      echoCreate();

      await createTemplate({ slug: 'acme', sourceTemplateId: 'tpl-db' });

      expect(createdArgs().data.content).toEqual({
        setup: storedTemplate.content.setup,
        tasks: [
          { id: expect.any(String), type: 'BONUS_TASK', title: 'Bonus' },
          { id: expect.any(String), type: 'VISIT_URL', title: 'Visit' }
        ],
        prizes: [{ id: expect.any(String), name: 'Shirt', quota: 1 }],
        audience: {
          allowedIdentities: ['TWITTER'],
          formFields: [
            { id: expect.any(String), type: 'EMAIL', label: 'Email' }
          ]
        },
        terms: { type: 'TEMPLATE', sponsorName: 'Summer Co' },
        design: undefined,
        criteria: undefined,
        visibility: undefined
      });
    });

    it('returns the VALIDATION_ERROR for a malformed stored row', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.findFirst.mockResolvedValue({
        ...storedTemplate,
        id: 99
      });

      const result = await createTemplate({
        slug: 'acme',
        sourceTemplateId: 'tpl-db'
      });

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Template validation failed'
      );
      expect(prismaMock.template.create).not.toHaveBeenCalled();
    });
  });

  describe('when the database fails', () => {
    it('maps a P2025 error from the create to NOT_FOUND', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.create.mockRejectedValue(knownRequestError('P2025'));

      const result = await createTemplate({ slug: 'acme' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
    });

    it('returns UNPROCESSABLE_CONTENT when the created record has no id', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team);
      prismaMock.template.create.mockResolvedValue({ name: 'x' });

      const result = await createTemplate({ slug: 'acme' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed: /
      );
    });
  });
});
