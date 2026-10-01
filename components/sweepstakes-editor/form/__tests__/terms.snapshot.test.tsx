import { describe, expect, it } from 'vitest';
import { stringifyTerms } from '../terms';

describe('stringifyTerms', () => {
  it('matches the snapshot of the default terms', () => {
    expect(stringifyTerms()).toMatchSnapshot();
  });
});
