import { DeepPartial } from '@/lib/types';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { z } from 'zod';

type SweepstakesTemplateSchema = Omit<
  DeepPartial<GiveawayFormSchema>,
  'timing' | 'terms' | 'prizes' | 'visibility'
>;
export const sweepstakesTemplateSchema = z.custom<SweepstakesTemplateSchema>(
  (data): data is SweepstakesTemplateSchema =>
    typeof data === 'object' && data !== null
);

export const staticTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  image: z.string(),
  tags: z.array(z.string()),
  content: sweepstakesTemplateSchema
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
