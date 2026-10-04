import { describe, expect, it } from 'vitest';
import { $Enums, Prisma } from '@prisma/client';
import * as model from '..';

const exported: Record<string, unknown> = model;

describe('@giveaway/db-model', () => {
  it.each(Object.entries($Enums))('exports the %s enum', (name, values) => {
    expect(exported[name]).toBe(values);
  });

  it('exports the Prisma namespace', () => {
    expect(model.Prisma).toBe(Prisma);
  });
});
