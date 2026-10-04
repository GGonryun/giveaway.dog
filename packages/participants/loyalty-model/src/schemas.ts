import z from 'zod';

export const userHostRelationshipSchema = z.object({
  loyalty: z.number().int().min(0)
});

export type UserHostRelationshipSchema = z.infer<
  typeof userHostRelationshipSchema
>;
