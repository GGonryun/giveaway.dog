import { describe, expect, it, vi } from 'vitest';
import { GiveawayTerms } from '@/schemas/giveaway/schemas';
import {
  buildFormValues,
  buildTemplateTerms,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
import { TermsAndConditions } from '../terms';

vi.hoisted(() => {
  process.env.TZ = 'UTC';
});

vi.mock('@/components/ui/minimal-tiptap-editor', () => ({
  MinimalTiptap: ({
    content,
    onChange,
    placeholder
  }: {
    content?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      aria-label={placeholder}
      value={content ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  )
}));

const renderTerms = (
  terms: GiveawayTerms = buildTemplateTerms({ sponsorName: 'Acme Inc' }),
  validate = false
) =>
  renderWithForm(<TermsAndConditions />, {
    values: buildFormValues({ terms }),
    layout: { id: 'sweepstakes-1' },
    validate
  });

describe('TermsAndConditions', () => {
  describe('with template terms', () => {
    it('matches the snapshot', () => {
      const { container } = renderTerms();
      expect(stabilizeIds(container)).toMatchSnapshot();
    });
  });

  describe('with custom terms', () => {
    const customTerms: GiveawayTerms = {
      type: 'CUSTOM',
      text: '<p>Our own rules</p>'
    };

    it('matches the snapshot', () => {
      const { container } = renderTerms(customTerms);
      expect(stabilizeIds(container)).toMatchSnapshot();
    });
  });
});
