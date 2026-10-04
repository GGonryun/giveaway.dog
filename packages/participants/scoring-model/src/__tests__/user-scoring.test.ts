import { describe, it, expect } from 'vitest';
import * as userScoring from '../user-scoring';
import * as signupSchemas from '../schemas/signup';

describe('schemas/user-scoring', () => {
  it('re-exports the signup scoring schema module unchanged', () => {
    expect(Object.keys(userScoring).sort()).toEqual(
      Object.keys(signupSchemas).sort()
    );
    for (const [name, value] of Object.entries(signupSchemas)) {
      expect(userScoring).toHaveProperty(name, value);
    }
  });

  it('does not expose the imported scoring exports', () => {
    expect(userScoring).not.toHaveProperty('IMPORTED_BASE_SCORE');
  });
});
