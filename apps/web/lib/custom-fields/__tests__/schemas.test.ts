import { describe, it, expect } from 'vitest';
import { SweepstakesFormFieldType } from '@prisma/client';
import { UserIcon, BalloonIcon, MailIcon } from 'lucide-react';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import {
  ageSweepstakesFormFieldSchema,
  baseSweepstakesFormFieldSchema,
  FIELD_TYPE_ICON,
  FIELD_TYPE_LABELS,
  sweepstakesFormFieldSchema
} from '../schemas';

const issueMessages = (result: {
  success: boolean;
  error?: { issues: { message: string; path: (string | number)[] }[] };
}) =>
  (result.error?.issues ?? []).map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message
  }));

describe('baseSweepstakesFormFieldSchema', () => {
  it('accepts an id and a non-empty label', () => {
    expect(
      baseSweepstakesFormFieldSchema.parse({ id: 'f-1', label: 'Name' })
    ).toEqual({ id: 'f-1', label: 'Name' });
  });

  it('rejects an empty label with a custom message', () => {
    const result = baseSweepstakesFormFieldSchema.safeParse({
      id: 'f-1',
      label: ''
    });

    expect(issueMessages(result)).toEqual([
      { path: 'label', message: 'Label is required' }
    ]);
  });

  it('rejects a missing id', () => {
    const result = baseSweepstakesFormFieldSchema.safeParse({ label: 'Name' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['id']);
  });

  it('strips unknown keys', () => {
    expect(
      baseSweepstakesFormFieldSchema.parse({
        id: 'f-1',
        label: 'Name',
        extra: true
      })
    ).toEqual({ id: 'f-1', label: 'Name' });
  });
});

describe('ageSweepstakesFormFieldSchema', () => {
  const base = { id: 'f-1', label: 'Age', type: 'AGE' };

  it('defaults required to false and leaves bounds undefined', () => {
    expect(ageSweepstakesFormFieldSchema.parse(base)).toEqual({
      id: 'f-1',
      label: 'Age',
      type: 'AGE',
      required: false
    });
  });

  it('accepts null bounds', () => {
    expect(
      ageSweepstakesFormFieldSchema.parse({
        ...base,
        minimum: null,
        maximum: null,
        required: true
      })
    ).toEqual({ ...base, minimum: null, maximum: null, required: true });
  });

  it('accepts integer bounds without checking their order', () => {
    expect(
      ageSweepstakesFormFieldSchema.parse({ ...base, minimum: 30, maximum: 10 })
    ).toEqual({ ...base, minimum: 30, maximum: 10, required: false });
  });

  it('rejects a fractional minimum', () => {
    const result = ageSweepstakesFormFieldSchema.safeParse({
      ...base,
      minimum: 16.5
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['minimum']);
  });

  it('rejects a fractional maximum', () => {
    const result = ageSweepstakesFormFieldSchema.safeParse({
      ...base,
      maximum: 99.9
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['maximum']);
  });

  it('rejects a type other than AGE', () => {
    const result = ageSweepstakesFormFieldSchema.safeParse({
      ...base,
      type: 'EMAIL'
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['type']);
  });
});

describe('sweepstakesFormFieldSchema', () => {
  describe('USERNAME fields', () => {
    it('defaults required to false and allows an omitted placeholder', () => {
      expect(
        sweepstakesFormFieldSchema.parse({
          id: 'u',
          label: 'Username',
          type: 'USERNAME'
        })
      ).toEqual({
        id: 'u',
        label: 'Username',
        type: 'USERNAME',
        required: false
      });
    });

    it('keeps a placeholder and required flag', () => {
      expect(
        sweepstakesFormFieldSchema.parse({
          id: 'u',
          label: 'Username',
          type: 'USERNAME',
          placeholder: 'your name',
          required: true
        })
      ).toEqual({
        id: 'u',
        label: 'Username',
        type: 'USERNAME',
        placeholder: 'your name',
        required: true
      });
    });

    it('drops age bounds that do not belong to the USERNAME shape', () => {
      expect(
        sweepstakesFormFieldSchema.parse({
          id: 'u',
          label: 'Username',
          type: 'USERNAME',
          minimum: 5
        })
      ).not.toHaveProperty('minimum');
    });
  });

  describe('AGE fields', () => {
    it('parses with the age schema rules', () => {
      expect(
        sweepstakesFormFieldSchema.parse({
          id: 'a',
          label: 'Age',
          type: 'AGE',
          minimum: 18
        })
      ).toEqual({
        id: 'a',
        label: 'Age',
        type: 'AGE',
        minimum: 18,
        required: false
      });
    });
  });

  describe('EMAIL fields', () => {
    it('accepts a null placeholder', () => {
      expect(
        sweepstakesFormFieldSchema.parse({
          id: 'e',
          label: 'Email',
          type: 'EMAIL',
          placeholder: null
        })
      ).toEqual({ id: 'e', label: 'Email', type: 'EMAIL', placeholder: null });
    });

    it('strips the required flag because the EMAIL shape does not declare it', () => {
      const parsed = sweepstakesFormFieldSchema.parse({
        id: 'e',
        label: 'Email',
        type: 'EMAIL',
        required: true
      });

      expect(parsed).toEqual({ id: 'e', label: 'Email', type: 'EMAIL' });
      expect(parsed).not.toHaveProperty('required');
    });
  });

  describe('TWITTER fields', () => {
    it('accepts an explicit null placeholder and defaults required to false', () => {
      expect(
        sweepstakesFormFieldSchema.parse({
          id: 't',
          label: 'X profile',
          type: 'TWITTER',
          placeholder: null
        })
      ).toEqual({
        id: 't',
        label: 'X profile',
        type: 'TWITTER',
        placeholder: null,
        required: false
      });
    });

    it('rejects an omitted placeholder because it is nullable but not optional', () => {
      const result = sweepstakesFormFieldSchema.safeParse({
        id: 't',
        label: 'X profile',
        type: 'TWITTER'
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['placeholder']);
    });
  });

  it('rejects an unknown discriminator', () => {
    const result = sweepstakesFormFieldSchema.safeParse({
      id: 'x',
      label: 'Phone',
      type: 'PHONE'
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      code: 'invalid_union_discriminator',
      path: ['type']
    });
  });

  it('rejects an empty label for any field type', () => {
    const result = sweepstakesFormFieldSchema.safeParse({
      id: 'e',
      label: '',
      type: 'EMAIL'
    });

    expect(issueMessages(result)).toEqual([
      { path: 'label', message: 'Label is required' }
    ]);
  });
});

describe('FIELD_TYPE_ICON', () => {
  it('maps every form field type to its icon component', () => {
    expect(FIELD_TYPE_ICON).toEqual({
      [SweepstakesFormFieldType.USERNAME]: UserIcon,
      [SweepstakesFormFieldType.AGE]: BalloonIcon,
      [SweepstakesFormFieldType.EMAIL]: MailIcon,
      [SweepstakesFormFieldType.TWITTER]: SocialXIcon
    });
  });

  it('covers exactly the prisma form field types', () => {
    expect(Object.keys(FIELD_TYPE_ICON).sort()).toEqual(
      Object.values(SweepstakesFormFieldType).sort()
    );
  });
});

describe('FIELD_TYPE_LABELS', () => {
  it('maps every form field type to its display label', () => {
    expect(FIELD_TYPE_LABELS).toEqual({
      USERNAME: 'Username',
      AGE: 'Age',
      EMAIL: 'Email',
      TWITTER: 'Twitter Profile'
    });
  });
});
