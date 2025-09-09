import { Prisma } from '@prisma/client';

// Prisma.JsonValue can be string, number, boolean, array, object, or null.
export const toJsonObject = (
  value: Prisma.JsonValue | null
): Record<string, any> => {
  if (!value) {
    return {};
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }

  return {};
};
