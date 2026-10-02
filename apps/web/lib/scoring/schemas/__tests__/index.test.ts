import { describe, it, expect } from 'vitest';
import * as barrel from '../index';
import * as imported from '../imported';
import * as signup from '../signup';

describe('lib/scoring/schemas barrel', () => {
  it('re-exports every runtime export of the imported schema module', () => {
    for (const [name, value] of Object.entries(imported)) {
      expect(barrel).toHaveProperty(name, value);
    }
  });

  it('re-exports every runtime export of the signup schema module', () => {
    for (const [name, value] of Object.entries(signup)) {
      expect(barrel).toHaveProperty(name, value);
    }
  });

  it('exports nothing beyond the two modules', () => {
    expect(Object.keys(barrel).sort()).toEqual(
      [...Object.keys(imported), ...Object.keys(signup)].sort()
    );
  });
});
