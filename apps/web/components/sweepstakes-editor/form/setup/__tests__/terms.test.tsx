import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GiveawayTerms } from '@/schemas/giveaway/schemas';
import {
  buildFormValues,
  buildTemplateTerms,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
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

const getTypeButton = (label: 'Default' | 'Custom') =>
  screen.getByRole('button', { name: label });

const getPreviewText = () => {
  const preview = screen.getAllByRole('textbox')[0];
  if (!(preview instanceof HTMLTextAreaElement)) {
    throw new Error('Terms preview not found');
  }
  return preview.value;
};

const openSheet = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Modify' }));
  return screen.getByRole('dialog', { name: 'Customize Terms & Conditions' });
};

const getLivePreview = (sheet: HTMLElement) => {
  const preview = within(sheet).getByText('Live Preview').nextElementSibling;
  if (!(preview instanceof HTMLElement)) throw new Error('Preview not found');
  return preview;
};

describe('TermsAndConditions', () => {
  describe('with template terms', () => {
    it('marks the default terms as selected', () => {
      renderTerms();
      expect(
        getTypeButton('Default').querySelector('.lucide-square-check-big')
      ).toBeInTheDocument();
      expect(
        getTypeButton('Custom').querySelector('.lucide-square-check-big')
      ).not.toBeInTheDocument();
    });

    it('previews the terms generated from the form', () => {
      renderTerms();
      const preview = getPreviewText();
      expect(preview).toContain('sponsored by Acme Inc (“Sponsor”)');
      expect(preview).toContain(
        'The Promotion begins on July 1, 2026 and ends on July 15, 2026.'
      );
      expect(preview).toContain(
        'Enter via https://giveaway.dog/browse/sweepstakes-1.'
      );
      expect(preview).toContain("1 winner will receive 'Gift Card'");
      expect(preview).toContain(
        'The Promotion is open Global to all individuals'
      );
    });

    it('switches to custom terms', async () => {
      const { form } = renderTerms();
      await userEvent.click(getTypeButton('Custom'));

      expect(form.getValues('terms.type')).toBe('CUSTOM');
      expect(
        screen.getByRole('textbox', { name: 'Enter a description' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Modify' })
      ).not.toBeInTheDocument();
    });
  });

  describe('with custom terms', () => {
    const customTerms: GiveawayTerms = {
      type: 'CUSTOM',
      text: '<p>Our own rules</p>'
    };

    it('edits the custom text', async () => {
      const { form } = renderTerms(customTerms);
      const editor = screen.getByRole('textbox', {
        name: 'Enter a description'
      });
      expect(editor).toHaveValue('<p>Our own rules</p>');

      await userEvent.clear(editor);
      await userEvent.type(editor, 'New rules');
      expect(form.getValues('terms')).toEqual({
        type: 'CUSTOM',
        text: 'New rules'
      });
    });

    it('switches back to the default terms', async () => {
      const { form } = renderTerms(customTerms);
      await userEvent.click(getTypeButton('Default'));

      expect(form.getValues('terms.type')).toBe('TEMPLATE');
      expect(
        screen.getByRole('button', { name: 'Modify' })
      ).toBeInTheDocument();
    });
  });

  describe('customizing the template', () => {
    it('opens the template fields with the current values', async () => {
      renderTerms();
      const sheet = await openSheet();

      expect(within(sheet).getByLabelText('Sponsor Name')).toHaveValue(
        'Acme Inc'
      );
      expect(
        within(sheet).getByLabelText('Winner Selection Method')
      ).toHaveValue('Random Drawing');
      expect(
        within(sheet).getByLabelText('Winners will be contacted within (days)')
      ).toHaveValue(7);
      expect(within(sheet).getByLabelText('Governing Law Country')).toHaveValue(
        'USA'
      );
    });

    it('updates the live preview as the fields change', async () => {
      renderTerms();
      const sheet = await openSheet();
      const sponsor = within(sheet).getByLabelText('Sponsor Name');
      await userEvent.clear(sponsor);
      await userEvent.type(sponsor, 'Globex');

      expect(getLivePreview(sheet)).toHaveTextContent('sponsored by Globex');
    });

    it.each([
      ['14', 14],
      ['0', 1],
      ['', 1]
    ])('stores %j notification days as %s', async (typed, stored) => {
      const { form } = renderTerms();
      const sheet = await openSheet();
      fireEvent.change(
        within(sheet).getByLabelText('Winners will be contacted within (days)'),
        { target: { value: typed } }
      );
      expect(form.getValues('terms')).toMatchObject({
        notificationTimeframeDays: stored
      });
    });

    it('stores the claim deadline as a number', async () => {
      const { form } = renderTerms();
      const sheet = await openSheet();
      fireEvent.change(
        within(sheet).getByLabelText('Winner must claim within (days)'),
        { target: { value: '30' } }
      );
      expect(form.getValues('terms')).toMatchObject({ claimDeadlineDays: 30 });
    });

    it('closes the sheet when valid terms are saved', async () => {
      renderTerms(buildTemplateTerms({ sponsorName: 'Acme Inc' }), true);
      const sheet = await openSheet();
      await userEvent.click(
        within(sheet).getByRole('button', { name: 'Save Terms & Conditions' })
      );

      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: 'Customize Terms & Conditions' })
        ).not.toBeInTheDocument()
      );
    });

    it('blocks saving while the terms are invalid', async () => {
      renderTerms(buildTemplateTerms({ sponsorName: 'Acme Inc' }), true);
      const sheet = await openSheet();
      await userEvent.clear(within(sheet).getByLabelText('Sponsor Name'));

      expect(
        await within(sheet).findByText('Sponsor name is required')
      ).toBeInTheDocument();
      const save = within(sheet).getByRole('button', {
        name: 'Save Terms & Conditions'
      });
      expect(save).toBeDisabled();
      expect(save).toHaveAttribute(
        'title',
        'Please fix validation errors before saving'
      );
    });

    it('rejects an invalid privacy policy URL', async () => {
      renderTerms(buildTemplateTerms({ sponsorName: 'Acme Inc' }), true);
      const sheet = await openSheet();
      await userEvent.type(
        within(sheet).getByLabelText('Privacy Policy URL'),
        'not a url'
      );

      expect(
        await within(sheet).findByText('Privacy policy must be a valid URL')
      ).toBeInTheDocument();
    });

    it('closes without asking when nothing changed', async () => {
      renderTerms();
      await openSheet();
      await userEvent.keyboard('{Escape}');

      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      );
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    describe('when closing with unsaved changes', () => {
      const closeWithChanges = async () => {
        const view = renderTerms();
        const sheet = await openSheet();
        const sponsor = within(sheet).getByLabelText('Sponsor Name');
        await userEvent.clear(sponsor);
        await userEvent.type(sponsor, 'Globex');
        await userEvent.keyboard('{Escape}');
        return view;
      };

      it('asks to discard the changes', async () => {
        await closeWithChanges();
        expect(
          screen.getByRole('alertdialog', { name: 'Discard all changes?' })
        ).toBeInTheDocument();
      });

      it('keeps editing when asked to', async () => {
        const { form } = await closeWithChanges();
        await userEvent.click(
          screen.getByRole('button', { name: 'Keep editing' })
        );

        await waitFor(() =>
          expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        );
        expect(
          screen.getByRole('dialog', { name: 'Customize Terms & Conditions' })
        ).toBeInTheDocument();
        expect(form.getValues('terms')).toMatchObject({
          sponsorName: 'Globex'
        });
      });

      it('restores the previous terms when discarded', async () => {
        const { form } = await closeWithChanges();
        await userEvent.click(
          screen.getByRole('button', { name: 'Discard changes' })
        );

        await waitFor(() =>
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        );
        expect(form.getValues('terms')).toMatchObject({
          sponsorName: 'Acme Inc'
        });
      });

      it.fails(
        'keeps unrelated unsaved changes dirty when discarded',
        async () => {
          const { form } = renderTerms();
          form.setValue('setup.name', 'Changed Name', { shouldDirty: true });
          const sheet = await openSheet();
          await userEvent.type(
            within(sheet).getByLabelText('Sponsor Name'),
            '!'
          );
          await userEvent.keyboard('{Escape}');
          await userEvent.click(
            screen.getByRole('button', { name: 'Discard changes' })
          );

          expect(form.getValues('setup.name')).toBe('Changed Name');
          expect(form.getFieldState('setup.name').isDirty).toBe(true);
        }
      );
    });

    it.fails(
      'refreshes the terms preview after the terms are saved',
      async () => {
        renderTerms();
        const sheet = await openSheet();
        const sponsor = within(sheet).getByLabelText('Sponsor Name');
        await userEvent.clear(sponsor);
        await userEvent.type(sponsor, 'Globex');
        await userEvent.click(
          within(sheet).getByRole('button', { name: 'Save Terms & Conditions' })
        );
        await waitFor(() =>
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        );

        expect(getPreviewText()).toContain('sponsored by Globex');
      }
    );
  });
});
