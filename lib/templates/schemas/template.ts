import { z } from 'zod';
import { baseGiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { Prisma } from '@prisma/client';
import { ApplicationError } from '@/lib/errors';
import { DeepPartial, Nil } from '@/lib/types';

export const baseContentSchema = baseGiveawayFormSchema({
  validate: false
}).omit({
  timing: true
});

export type BaseContentSchema = z.infer<typeof baseContentSchema>;

export const templateSettingsSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  image: z.string().url('Must be a valid image URL')
});

export type TemplateSettingsSchema = z.infer<typeof templateSettingsSchema>;

export const templateFormSchema = baseContentSchema.extend({
  template: templateSettingsSchema
});

export type TemplateFormSchema = z.infer<typeof templateFormSchema>;

export const templateDetailsSchema = templateFormSchema.extend({
  id: z.string()
});

export type TemplateDetailsSchema = z.infer<typeof templateDetailsSchema>;

export const databaseTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  image: z.string(),
  content: baseContentSchema,
  teamId: z.string(),
  createdById: z.string()
});

export type DatabaseTemplateSchema = z.infer<typeof databaseTemplateSchema>;

export type StoredTemplateSchema = {
  id: string;
  name: string;
  description: string;
  image: string;
  teamId: string;
  createdById: string;
  content: DeepPartial<DatabaseTemplateSchema>['content'];
};

export const storedTemplateSchema = z.custom<StoredTemplateSchema>(
  (data): data is StoredTemplateSchema =>
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as any).id === 'string'
);

export const toStorableTemplateSchema = (
  schema: Omit<TemplateInputSchema, 'id'>
) => {
  const { template, ...content } = schema;
  const { name, description, image } = template ?? {};

  return {
    name,
    description,
    image,
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
  };
};

export const fromStorableTemplateSchema = (
  schema: StoredTemplateSchema
): TemplateInputSchema => {
  return {
    id: schema.id,
    ...schema.content,
    template: {
      name: schema.name,
      description: schema.description,
      image: schema.image
    }
  };
};

export const templateFiltersSchema = z
  .object({
    search: z.string()
  })
  .partial();

export type TemplateFiltersSchema = z.infer<typeof templateFiltersSchema>;

export const toTemplateFilters = (s: unknown): TemplateFiltersSchema => {
  const obj = s as Record<string, string | string[]>;
  return {
    search: typeof obj.search === 'string' ? obj.search : ''
  };
};

export type TemplateInputSchema = DeepPartial<TemplateFormSchema> & {
  template: TemplateSettingsSchema;
  id: string;
};

export const templateInputSchema = z.custom<TemplateInputSchema>(
  (data): data is TemplateInputSchema =>
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as any).id === 'string'
);

export const toTemplateFormSchema = (
  dbTemplate: Nil<Prisma.TemplateGetPayload<{}>>
): TemplateFormSchema => {
  const parsed = databaseTemplateSchema.safeParse(dbTemplate);
  if (!parsed.success)
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Template validation failed',
      cause: parsed.error
    });

  const storable = parsed.data;

  return {
    ...storable.content,
    template: {
      name: storable.name,
      description: storable.description,
      image: storable.image
    }
  };
};

export const toTemplateInputSchema = (
  dbTemplate: Nil<Prisma.TemplateGetPayload<{}>>
): TemplateInputSchema => {
  const parsed = storedTemplateSchema.safeParse(dbTemplate);
  if (!parsed.success)
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Template validation failed',
      cause: parsed.error
    });

  const storable = parsed.data;

  return {
    ...storable.content,
    id: storable.id,
    template: {
      name: storable.name,
      description: storable.description,
      image: storable.image
    }
  };
};

export const templateListItemSchema = z.object({
  teamId: z.string(),
  team: z.object({
    name: z.string(),
    slug: z.string(),
    logo: z.string()
  }),
  createdBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable()
  }),
  isCustom: z.boolean(),
  template: templateInputSchema
});

export type TemplateListItemSchema = z.infer<typeof templateListItemSchema>;

export const templateListSchema = z.object({
  templates: z.array(templateListItemSchema)
});

export type TemplateListSchema = z.infer<typeof templateListSchema>;
