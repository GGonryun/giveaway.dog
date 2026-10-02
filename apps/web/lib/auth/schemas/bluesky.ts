import { blueskyHandleSchema } from '@/schemas/user';
import z from 'zod';

export const blueskyLoginFormSchema = z.object({
  blueskyHandle: blueskyHandleSchema
});

export type BlueskyLoginFormSchema = z.infer<typeof blueskyLoginFormSchema>;
