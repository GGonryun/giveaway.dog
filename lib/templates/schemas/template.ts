import { z } from 'zod';
import { baseGiveawayFormSchema } from '@/schemas/giveaway/schemas';

export const staticTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  image: z.string(),
  tags: z.array(z.string()),
  content: baseGiveawayFormSchema({ validate: false }).omit({
    timing: true,
    terms: true,
    prizes: true,
    visibility: true
  })
});

export type StaticTemplate = z.infer<typeof staticTemplateSchema>;

export const templateListItemSchema = staticTemplateSchema.extend({
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
  })
});

export type TemplateListItemSchema = z.infer<typeof templateListItemSchema>;

export const templateListSchema = z.object({
  templates: z.array(templateListItemSchema)
});

export type TemplateListSchema = z.infer<typeof templateListSchema>;

export const templateDetailSchema = templateListItemSchema;

export type TemplateDetailSchema = z.infer<typeof templateDetailSchema>;

export const templateFiltersSchema = z
  .object({
    tags: z.array(z.string()),
    search: z.string()
  })
  .partial();

export type TemplateFiltersSchema = z.infer<typeof templateFiltersSchema>;

export const toTemplateFilters = (s: unknown): TemplateFiltersSchema => {
  const obj = s as Record<string, string | string[]>;
  return {
    tags: Array.isArray(obj.tags) ? obj.tags : obj.tags ? [obj.tags] : [],
    search: typeof obj.search === 'string' ? obj.search : ''
  };
};

export const TEMPLATE_TAG_OPTIONS = [
  'Tech',
  'Gaming',
  'Beauty',
  'Health',
  'Seasonal',
  'Luxury',
  'Sports',
  'Food',
  'Fashion',
  'Entertainment',
  'Education',
  'Charity',
  'Travel',
  'Fitness',
  'Business'
] as const;

export type TemplateTag = (typeof TEMPLATE_TAG_OPTIONS)[number];
