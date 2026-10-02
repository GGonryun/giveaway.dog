import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import type { Prisma } from '@prisma/client';
import {
  baseContentSchema,
  databaseTemplateSchema,
  fromStorableTemplateSchema,
  storedTemplateSchema,
  templateDetailsSchema,
  templateFiltersSchema,
  templateFormSchema,
  templateInputSchema,
  templateListItemSchema,
  templateListSchema,
  templateSettingsSchema,
  toStorableTemplateSchema,
  toTemplateFilters,
  toTemplateFormSchema,
  toTemplateInputSchema,
  type StoredTemplateSchema,
  type TemplateInputSchema
} from '../template';
import { ApplicationError } from '@/lib/errors';

const settings = {
  name: 'Launch Party',
  description: 'Celebrate our launch',
  image: 'https://example.com/launch.png'
};

const validContent = () => ({
  setup: { name: 'Launch', description: 'Win stuff', banner: '' },
  terms: {
    type: 'TEMPLATE' as const,
    sponsorName: 'Acme',
    winnerSelectionMethod: 'Random Drawing',
    notificationTimeframeDays: 7,
    claimDeadlineDays: 7,
    governingLawCountry: 'USA'
  },
  audience: { allowedIdentities: ['TWITTER' as const] },
  tasks: [
    {
      id: 'task-1',
      type: 'BONUS_TASK' as const,
      title: 'Bonus',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    }
  ],
  prizes: [{ id: 'prize-1', name: 'T-shirt', quota: 1 }],
  design: {
    displayName: true,
    displayDescription: true,
    background: { type: 'color' as const, color: '#fff' }
  },
  visibility: { visibility: 'PUBLIC' as const, slug: 'launch' },
  criteria: {}
});

const dbTemplate = (
  overrides: Partial<Prisma.TemplateGetPayload<{}>> = {}
): Prisma.TemplateGetPayload<{}> => ({
  id: 'tpl-1',
  name: settings.name,
  description: settings.description,
  image: settings.image,
  type: 'SWEEPSTAKES',
  content: validContent(),
  teamId: 'team-1',
  createdById: 'user-1',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides
});

const without = (value: object, key: string) =>
  Object.fromEntries(Object.entries(value).filter(([name]) => name !== key));

const issuePaths = (result: { error?: ZodError }) =>
  (result.error?.issues ?? []).map((issue) => issue.path.join('.'));

describe('baseContentSchema', () => {
  it('contains every giveaway form section except timing', () => {
    expect(Object.keys(baseContentSchema.shape).sort()).toEqual([
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

  it('applies the giveaway form defaults when parsing', () => {
    const parsed = baseContentSchema.parse(validContent());

    expect(parsed.audience).toEqual({
      allowedIdentities: ['TWITTER'],
      requirePreEntryLogin: false,
      formFields: []
    });
    expect(parsed.criteria).toEqual({
      minTasksCompleted: 1,
      minQualityScore: 70,
      allowMultipleWins: false,
      allowUserSelection: false
    });
    expect(parsed.design.aspectRatio).toBe('VIDEO');
  });

  it('strips a timing section', () => {
    const parsed = baseContentSchema.parse({
      ...validContent(),
      timing: { startDate: new Date() }
    });

    expect(parsed).not.toHaveProperty('timing');
  });
});

describe('templateSettingsSchema', () => {
  it('accepts a name, description and image url', () => {
    expect(templateSettingsSchema.parse(settings)).toEqual(settings);
  });

  it('accepts the shortest and longest allowed name', () => {
    expect(
      templateSettingsSchema.safeParse({ ...settings, name: 'abc' }).success
    ).toBe(true);
    expect(
      templateSettingsSchema.safeParse({ ...settings, name: 'a'.repeat(80) })
        .success
    ).toBe(true);
  });

  it('rejects a name shorter than 3 characters', () => {
    const result = templateSettingsSchema.safeParse({
      ...settings,
      name: 'ab'
    });

    expect(result.error?.issues[0].message).toBe(
      'Name must be at least 3 characters'
    );
  });

  it('rejects a name longer than 80 characters', () => {
    const result = templateSettingsSchema.safeParse({
      ...settings,
      name: 'a'.repeat(81)
    });

    expect(result.error?.issues[0].message).toBe(
      'Name must be at most 80 characters'
    );
  });

  it('accepts the shortest allowed description', () => {
    expect(
      templateSettingsSchema.safeParse({ ...settings, description: 'abc' })
        .success
    ).toBe(true);
  });

  it('accepts the longest allowed description', () => {
    expect(
      templateSettingsSchema.safeParse({
        ...settings,
        description: 'a'.repeat(300)
      }).success
    ).toBe(true);
  });

  it('rejects a description shorter than 3 characters', () => {
    const result = templateSettingsSchema.safeParse({
      ...settings,
      description: 'ab'
    });

    expect(result.error?.issues[0].message).toBe(
      'Description must be at least 3 characters'
    );
  });

  it('rejects a description longer than 300 characters', () => {
    const result = templateSettingsSchema.safeParse({
      ...settings,
      description: 'a'.repeat(301)
    });

    expect(result.error?.issues[0].message).toBe(
      'Description must be at most 300 characters'
    );
  });

  it('rejects an image that is not a url', () => {
    const result = templateSettingsSchema.safeParse({
      ...settings,
      image: 'placeholder.png'
    });

    expect(result.error?.issues[0].message).toBe('Must be a valid image URL');
  });

  it('rejects an empty image', () => {
    const result = templateSettingsSchema.safeParse({ ...settings, image: '' });

    expect(issuePaths(result)).toEqual(['image']);
  });
});

describe('templateFormSchema', () => {
  it('accepts content together with template settings', () => {
    const result = templateFormSchema.safeParse({
      ...validContent(),
      template: settings
    });

    expect(result.success).toBe(true);
    expect(result.data?.template).toEqual(settings);
  });

  it('requires template settings', () => {
    const result = templateFormSchema.safeParse(validContent());

    expect(issuePaths(result)).toEqual(['template']);
  });

  it('reports content and settings errors together', () => {
    const result = templateFormSchema.safeParse({
      ...validContent(),
      tasks: [],
      template: { ...settings, name: 'x' }
    });

    expect(issuePaths(result).sort()).toEqual(['tasks', 'template.name']);
  });
});

describe('templateDetailsSchema', () => {
  it('requires an id in addition to the form fields', () => {
    const withoutId = templateDetailsSchema.safeParse({
      ...validContent(),
      template: settings
    });
    const withId = templateDetailsSchema.safeParse({
      ...validContent(),
      template: settings,
      id: 'tpl-1'
    });

    expect(issuePaths(withoutId)).toEqual(['id']);
    expect(withId.success).toBe(true);
  });
});

describe('databaseTemplateSchema', () => {
  it('accepts a stored template row with valid content', () => {
    const result = databaseTemplateSchema.safeParse(dbTemplate());

    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty('createdAt');
    expect(result.data).not.toHaveProperty('type');
  });

  it('rejects content that is not a valid giveaway form', () => {
    const result = databaseTemplateSchema.safeParse(
      dbTemplate({ content: { ...validContent(), prizes: [] } })
    );

    expect(issuePaths(result)).toEqual(['content.prizes']);
  });

  it.each([
    'id',
    'name',
    'description',
    'image',
    'content',
    'teamId',
    'createdById'
  ] as const)('rejects a row without %s', (key) => {
    const result = databaseTemplateSchema.safeParse(without(dbTemplate(), key));

    expect(issuePaths(result)).toEqual([key]);
  });
});

describe('storedTemplateSchema', () => {
  it('accepts any object with a string id and leaves it untouched', () => {
    const value = { id: 'tpl-1', content: { anything: true }, extra: 1 };

    expect(storedTemplateSchema.parse(value)).toBe(value);
  });

  it('rejects an object without an id', () => {
    expect(storedTemplateSchema.safeParse({ name: 'x' }).success).toBe(false);
  });

  it('rejects a non-string id', () => {
    expect(storedTemplateSchema.safeParse({ id: 1 }).success).toBe(false);
  });

  it('rejects null', () => {
    expect(storedTemplateSchema.safeParse(null).success).toBe(false);
  });

  it('rejects primitives', () => {
    expect(storedTemplateSchema.safeParse('tpl-1').success).toBe(false);
  });
});

describe('templateInputSchema', () => {
  it('accepts any object with a string id', () => {
    expect(
      templateInputSchema.safeParse({ id: 'tpl-1', template: settings }).success
    ).toBe(true);
  });

  it('accepts arrays carrying an id property', () => {
    const value = Object.assign([], { id: 'tpl-1' });

    expect(templateInputSchema.safeParse(value).success).toBe(true);
  });

  it('rejects an object without a string id', () => {
    expect(templateInputSchema.safeParse({ id: null }).success).toBe(false);
    expect(templateInputSchema.safeParse({}).success).toBe(false);
  });

  it('rejects undefined', () => {
    expect(templateInputSchema.safeParse(undefined).success).toBe(false);
  });

  it('rejects null', () => {
    expect(templateInputSchema.safeParse(null).success).toBe(false);
  });

  it('rejects primitives', () => {
    expect(templateInputSchema.safeParse('tpl-1').success).toBe(false);
  });
});

describe('toStorableTemplateSchema', () => {
  it('splits template settings from the content sections', () => {
    const content = validContent();

    expect(
      toStorableTemplateSchema({ ...content, template: settings })
    ).toEqual({
      name: settings.name,
      description: settings.description,
      image: settings.image,
      content: {
        setup: content.setup,
        tasks: content.tasks,
        terms: content.terms,
        design: content.design,
        prizes: content.prizes,
        audience: content.audience,
        criteria: content.criteria,
        visibility: content.visibility
      }
    });
  });

  it('drops keys that are not content sections', () => {
    const storable = toStorableTemplateSchema({
      ...validContent(),
      template: settings,
      id: 'tpl-1',
      timing: { timeZone: 'UTC' }
    } as unknown as Omit<TemplateInputSchema, 'id'>);

    expect(storable).not.toHaveProperty('id');
    expect(storable.content).not.toHaveProperty('timing');
    expect(storable.content).not.toHaveProperty('id');
  });

  it('keeps missing sections as undefined keys', () => {
    const storable = toStorableTemplateSchema({ template: settings });

    expect(storable.content).toEqual({
      setup: undefined,
      tasks: undefined,
      terms: undefined,
      design: undefined,
      prizes: undefined,
      audience: undefined,
      criteria: undefined,
      visibility: undefined
    });
    expect(Object.keys(storable.content)).toHaveLength(8);
  });

  it('tolerates missing template settings', () => {
    const storable = toStorableTemplateSchema({
      setup: { name: 'x' }
    } as unknown as Omit<TemplateInputSchema, 'id'>);

    expect(storable.name).toBeUndefined();
    expect(storable.description).toBeUndefined();
    expect(storable.image).toBeUndefined();
    expect(storable.content.setup).toEqual({ name: 'x' });
  });

  it('keeps nested section references', () => {
    const content = validContent();
    const storable = toStorableTemplateSchema({
      ...content,
      template: settings
    });

    expect(storable.content.tasks).toBe(content.tasks);
  });
});

describe('fromStorableTemplateSchema', () => {
  const stored: StoredTemplateSchema = {
    id: 'tpl-1',
    name: settings.name,
    description: settings.description,
    image: settings.image,
    teamId: 'team-1',
    createdById: 'user-1',
    content: { setup: { name: 'Launch' }, prizes: [] }
  };

  it('flattens the content and nests the template settings', () => {
    expect(fromStorableTemplateSchema(stored)).toEqual({
      id: 'tpl-1',
      setup: { name: 'Launch' },
      prizes: [],
      template: settings
    });
  });

  it('drops team and creator ids', () => {
    const result = fromStorableTemplateSchema(stored);

    expect(result).not.toHaveProperty('teamId');
    expect(result).not.toHaveProperty('createdById');
  });

  it('lets a content id override the stored id', () => {
    const result = fromStorableTemplateSchema({
      ...stored,
      content: { id: 'from-content' } as StoredTemplateSchema['content']
    });

    expect(result.id).toBe('from-content');
  });

  it('round-trips through toStorableTemplateSchema', () => {
    const content = validContent();
    const storable = toStorableTemplateSchema({
      ...content,
      template: settings
    });

    expect(
      fromStorableTemplateSchema({
        ...storable,
        id: 'tpl-9',
        teamId: 'team-1',
        createdById: 'user-1'
      })
    ).toEqual({ ...content, id: 'tpl-9', template: settings });
  });
});

describe('templateFiltersSchema', () => {
  it('accepts an empty filter', () => {
    expect(templateFiltersSchema.parse({})).toEqual({});
  });

  it('accepts a search string', () => {
    expect(templateFiltersSchema.parse({ search: 'x' })).toEqual({
      search: 'x'
    });
  });

  it('rejects a non-string search', () => {
    expect(templateFiltersSchema.safeParse({ search: 1 }).success).toBe(false);
  });
});

describe('toTemplateFilters', () => {
  it('keeps a string search value', () => {
    expect(toTemplateFilters({ search: 'giveaway' })).toEqual({
      search: 'giveaway'
    });
  });

  it('defaults a missing search to an empty string', () => {
    expect(toTemplateFilters({})).toEqual({ search: '' });
  });

  it('defaults an array search value to an empty string', () => {
    expect(toTemplateFilters({ search: ['a', 'b'] })).toEqual({ search: '' });
  });

  it('ignores unrelated keys', () => {
    expect(toTemplateFilters({ search: 'a', page: '2' })).toEqual({
      search: 'a'
    });
  });

  it('throws a TypeError for null input', () => {
    expect(() => toTemplateFilters(null)).toThrow(TypeError);
  });
});

describe('toTemplateFormSchema', () => {
  it('converts a valid database row into the form shape with defaults applied', () => {
    const result = toTemplateFormSchema(dbTemplate());

    expect(result).toEqual({
      ...baseContentSchema.parse(validContent()),
      template: settings
    });
  });

  it('throws a VALIDATION_ERROR when the row content is invalid', () => {
    let thrown: unknown;
    try {
      toTemplateFormSchema(
        dbTemplate({ content: { ...validContent(), tasks: [] } })
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ApplicationError);
    expect(thrown).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Template validation failed'
    });
    expect((thrown as ApplicationError).cause).toBeInstanceOf(ZodError);
  });

  it('throws a VALIDATION_ERROR for a null row', () => {
    expect(() => toTemplateFormSchema(null)).toThrow(
      'Template validation failed'
    );
  });

  it('throws a VALIDATION_ERROR for an undefined row', () => {
    expect(() => toTemplateFormSchema(undefined)).toThrow(ApplicationError);
  });
});

describe('toTemplateInputSchema', () => {
  it('flattens the stored content without validating it', () => {
    const row = dbTemplate({ content: { setup: { name: 'x' }, tasks: [] } });

    expect(toTemplateInputSchema(row)).toEqual({
      setup: { name: 'x' },
      tasks: [],
      id: 'tpl-1',
      template: settings
    });
  });

  it('lets the row id and settings win over same-named content keys', () => {
    const row = dbTemplate({
      content: { id: 'content-id', template: { name: 'content' } }
    });

    expect(toTemplateInputSchema(row)).toEqual({
      id: 'tpl-1',
      template: settings
    });
  });

  it('treats null content as empty', () => {
    expect(toTemplateInputSchema(dbTemplate({ content: null }))).toEqual({
      id: 'tpl-1',
      template: settings
    });
  });

  it('spreads array content by index', () => {
    expect(toTemplateInputSchema(dbTemplate({ content: ['a'] }))).toMatchObject(
      { 0: 'a', id: 'tpl-1' }
    );
  });

  it('throws a VALIDATION_ERROR for a null row', () => {
    let thrown: unknown;
    try {
      toTemplateInputSchema(null);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ApplicationError);
    expect(thrown).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Template validation failed'
    });
    expect((thrown as ApplicationError).cause).toBeInstanceOf(ZodError);
  });

  it('throws a VALIDATION_ERROR for a row with a non-string id', () => {
    expect(() =>
      toTemplateInputSchema(dbTemplate({ id: 7 as unknown as string }))
    ).toThrow('Template validation failed');
  });
});

describe('templateListItemSchema', () => {
  const item = {
    teamId: 'team-1',
    team: { name: 'Acme', slug: 'acme', logo: 'https://example.com/logo.png' },
    createdBy: { id: 'user-1', name: null, image: null },
    isCustom: true,
    template: { id: 'tpl-1', template: settings }
  };

  it('accepts a list item with nullable creator name and image', () => {
    expect(templateListItemSchema.safeParse(item).success).toBe(true);
  });

  it.each(['teamId', 'team', 'createdBy', 'isCustom', 'template'] as const)(
    'rejects an item without %s',
    (key) => {
      const result = templateListItemSchema.safeParse(without(item, key));

      expect(issuePaths(result)).toEqual([key]);
    }
  );

  it.each(['name', 'slug'] as const)('rejects a team without %s', (key) => {
    const result = templateListItemSchema.safeParse({
      ...item,
      team: without(item.team, key)
    });

    expect(issuePaths(result)).toEqual([`team.${key}`]);
  });

  it.each(['id', 'image'] as const)('rejects a creator without %s', (key) => {
    const result = templateListItemSchema.safeParse({
      ...item,
      createdBy: without(item.createdBy, key)
    });

    expect(issuePaths(result)).toEqual([`createdBy.${key}`]);
  });

  it('rejects a non-boolean isCustom flag', () => {
    const result = templateListItemSchema.safeParse({
      ...item,
      isCustom: 'true'
    });

    expect(issuePaths(result)).toEqual(['isCustom']);
  });

  it('rejects a team without a logo', () => {
    const result = templateListItemSchema.safeParse({
      ...item,
      team: { name: 'Acme', slug: 'acme', logo: null }
    });

    expect(issuePaths(result)).toEqual(['team.logo']);
  });

  it('rejects a missing creator name key', () => {
    const result = templateListItemSchema.safeParse({
      ...item,
      createdBy: { id: 'user-1', image: null }
    });

    expect(issuePaths(result)).toEqual(['createdBy.name']);
  });

  it('rejects a template without an id', () => {
    const result = templateListItemSchema.safeParse({
      ...item,
      template: { template: settings }
    });

    expect(issuePaths(result)).toEqual(['template']);
  });

  it('wraps items in a templates list', () => {
    expect(templateListSchema.parse({ templates: [item] })).toEqual({
      templates: [item]
    });
    expect(templateListSchema.safeParse({ templates: [{}] }).success).toBe(
      false
    );
  });
});
