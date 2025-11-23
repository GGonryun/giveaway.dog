import { UserSource, Prisma } from '@prisma/client';
import z from 'zod';
import { ApplicationError } from '../errors';

export const userSourceSchema = z.array(z.nativeEnum(UserSource));

export type UserSourceSchema = z.infer<typeof userSourceSchema>;

export const allowedUserSourcesSchema = userSourceSchema
  .refine(
    (sources) => sources.length <= 5,
    'A maximum of 5 external sources are allowed'
  )
  .refine(
    (sources) => sources.length >= 1,
    'At least one external source must be selected'
  );

export type AllowedUserSourcesSchema = z.infer<typeof allowedUserSourcesSchema>;

export const parseUserSourceSchema = (
  data: Prisma.JsonValue
): UserSourceSchema | null => {
  if (!data) {
    return null;
  }

  const sources = userSourceSchema.safeParse(data);
  if (!sources.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid external platforms format',
      cause: sources.error
    });
  }
  return sources.data;
};
