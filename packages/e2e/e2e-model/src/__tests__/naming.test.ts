import { describe, expect, it } from 'vitest';
import {
  e2eRunIdSchema,
  e2eTeamSlugSchema,
  isE2eNamespaceOfRun,
  isE2eTeamSlug,
  toE2eGiveawayName,
  toE2eRunTeamSlugPrefix,
  toE2eTeamSlug
} from '../naming';

describe('toE2eTeamSlug', () => {
  it('puts the namespace and the suffix after the e2e prefix', () => {
    expect(toE2eTeamSlug('abc123', 'w0')).toBe('e2e-abc123-w0');
  });

  it('starts with the run prefix when the namespace starts with the run id', () => {
    expect(
      toE2eTeamSlug('abc123w1', 'x').startsWith(
        toE2eRunTeamSlugPrefix('abc123')
      )
    ).toBe(true);
  });
});

describe('isE2eTeamSlug', () => {
  it.each(['e2e-abc123-w0', 'e2e-'])('accepts %s', (slug) => {
    expect(isE2eTeamSlug(slug)).toBe(true);
  });

  it.each(['team', 'my-e2e-team', 'E2E-abc', 'e2e', '', null, undefined])(
    'rejects %j',
    (slug) => {
      expect(isE2eTeamSlug(slug)).toBe(false);
    }
  );
});

describe('e2eTeamSlugSchema', () => {
  it('accepts a slug of 20 characters', () => {
    expect(e2eTeamSlugSchema.parse('e2e-abcdefghij-12345')).toHaveLength(20);
  });

  it.each(['e2e-abcdefghij-123456', 'team-abc', 'e2e-ABC', 'e2e-a b'])(
    'rejects %s',
    (slug) => {
      expect(e2eTeamSlugSchema.safeParse(slug).success).toBe(false);
    }
  );
});

describe('e2eRunIdSchema', () => {
  it('accepts 6 base36 characters', () => {
    expect(e2eRunIdSchema.parse('a1b2c3')).toBe('a1b2c3');
  });

  it.each(['a1b2c', 'a1b2c3d', 'A1B2C3', 'a1b2c%', '', 'e2e-a1'])(
    'rejects %s',
    (runId) => {
      expect(e2eRunIdSchema.safeParse(runId).success).toBe(false);
    }
  );
});

describe('isE2eNamespaceOfRun', () => {
  it('accepts a namespace that starts with the run id', () => {
    expect(isE2eNamespaceOfRun('abc123w0c1', 'abc123')).toBe(true);
  });

  it('rejects a namespace of another run', () => {
    expect(isE2eNamespaceOfRun('abc124w0c1', 'abc123')).toBe(false);
  });
});

describe('toE2eGiveawayName', () => {
  it('starts the name with the namespace', () => {
    expect(toE2eGiveawayName('abc123', 'Prize')).toBe('[e2e abc123] Prize');
  });
});
