import { describe, expect, it } from 'vitest';
import * as runner from '@stryker-mutator/vitest-runner';
import { strykerPlugins, strykerValidationSchema } from '../vitest-runner.ts';

describe('vitest-runner', () => {
  it('re-exports the Stryker plugins of the Vitest runner', () => {
    expect(strykerPlugins).toBe(runner.strykerPlugins);
    expect(strykerPlugins.map((plugin) => plugin.name)).toEqual(['vitest']);
  });

  it('re-exports the options schema of the Vitest runner', () => {
    expect(strykerValidationSchema).toBe(runner.strykerValidationSchema);
  });
});
