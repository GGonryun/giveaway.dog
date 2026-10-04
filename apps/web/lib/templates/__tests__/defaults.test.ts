import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TEMPLATE_CONTENT,
  DEFAULT_TEMPLATE_DESCRIPTION,
  DEFAULT_TEMPLATE_IMAGE,
  DEFAULT_TEMPLATE_NAME
} from '../defaults';
import {
  templateFormSchema,
  templateSettingsSchema
} from '../schemas/template';
import { DEFAULT_MINIMUM_AGE_FIELD } from '@giveaway/custom-fields-model/defaults';
import { sweepstakesFormFieldSchema } from '@giveaway/custom-fields-model/schemas';
import { DEFAULT_ALLOWED_IDENTITIES } from '@giveaway/app-config/settings';
import { DEFAULT_DESIGN_DATA } from '@/schemas/giveaway/defaults';

describe('template default constants', () => {
  it('names a new template', () => {
    expect(DEFAULT_TEMPLATE_NAME).toBe('My Custom Template');
  });

  it('describes a new template', () => {
    expect(DEFAULT_TEMPLATE_DESCRIPTION).toBe('A template I created');
  });

  it('uses the placeholder image from blob storage', () => {
    expect(DEFAULT_TEMPLATE_IMAGE).toBe(
      'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/placeholder.png'
    );
  });
});

describe('DEFAULT_TEMPLATE_CONTENT', () => {
  const content = DEFAULT_TEMPLATE_CONTENT({ sponsorName: 'Acme Inc' });

  it('uses the default template settings', () => {
    expect(content.template).toEqual({
      name: 'My Custom Template',
      description: 'A template I created',
      image: DEFAULT_TEMPLATE_IMAGE
    });
  });

  it('has template settings that satisfy the settings schema', () => {
    expect(templateSettingsSchema.safeParse(content.template).success).toBe(
      true
    );
  });

  it('uses the default sweepstakes setup with no banner', () => {
    expect(content.setup).toEqual({
      name: 'Untitled Sweepstakes',
      description: 'Enter to win a prize!',
      banner: ''
    });
  });

  it('starts unlisted with no slug', () => {
    expect(content.visibility).toEqual({ visibility: 'UNLISTED', slug: null });
  });

  it('allows the default identities without pre-entry login', () => {
    expect(content.audience.requirePreEntryLogin).toBe(false);
    expect(content.audience.allowedIdentities).toBe(DEFAULT_ALLOWED_IDENTITIES);
  });

  it('collects username, email and minimum age form fields', () => {
    expect(content.audience.formFields).toEqual([
      {
        id: expect.any(String),
        type: 'USERNAME',
        label: 'Username',
        required: true
      },
      { id: expect.any(String), label: 'Email', type: 'EMAIL' },
      { id: expect.any(String), ...DEFAULT_MINIMUM_AGE_FIELD }
    ]);
  });

  it('gives each form field a distinct nanoid', () => {
    const ids = content.audience.formFields.map((field) => field.id);

    for (const id of ids) {
      expect(id).toMatch(/^[A-Za-z0-9_-]{21}$/);
    }
    expect(new Set(ids).size).toBe(3);
  });

  it('generates a new id for every form field on every call', () => {
    const other = DEFAULT_TEMPLATE_CONTENT({ sponsorName: 'Acme Inc' });
    const previousIds = content.audience.formFields.map((field) => field.id);

    for (const field of other.audience.formFields) {
      expect(previousIds).not.toContain(field.id);
    }
  });

  it('produces form fields that satisfy the form field schema', () => {
    for (const field of content.audience.formFields) {
      expect(sweepstakesFormFieldSchema.safeParse(field).success).toBe(true);
    }
  });

  it('starts with no prizes or tasks', () => {
    expect(content.prizes).toEqual([]);
    expect(content.tasks).toEqual([]);
  });

  it('shares the default design data object', () => {
    expect(content.design).toBe(DEFAULT_DESIGN_DATA);
  });

  it('uses the default winner criteria', () => {
    expect(content.criteria).toEqual({
      minQualityScore: 50,
      minTasksCompleted: 1,
      allowMultipleWins: false,
      allowUserSelection: false
    });
  });

  it('fills templated terms with the given sponsor name', () => {
    expect(content.terms).toEqual({
      type: 'TEMPLATE',
      sponsorAddress: '',
      sponsorName: 'Acme Inc',
      winnerSelectionMethod: 'Random Drawing',
      notificationTimeframeDays: 7,
      claimDeadlineDays: 7,
      governingLawCountry: 'USA',
      privacyPolicyUrl: ''
    });
  });

  it('keeps an empty sponsor name as given', () => {
    expect(DEFAULT_TEMPLATE_CONTENT({ sponsorName: '' }).terms).toMatchObject({
      sponsorName: ''
    });
  });

  it('does not include timing', () => {
    expect(content).not.toHaveProperty('timing');
  });

  it('fails full form validation only because tasks and prizes are empty', () => {
    const result = templateFormSchema.safeParse(content);

    expect(result.error?.issues.map((issue) => issue.path)).toEqual([
      ['tasks'],
      ['prizes']
    ]);
  });
});
