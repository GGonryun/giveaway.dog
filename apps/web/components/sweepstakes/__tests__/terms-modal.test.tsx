import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { GiveawayTerms } from '@giveaway/sweepstakes-model/schemas';
import { TermsModal } from '../terms-modal';
import {
  buildAgeField,
  buildAudience,
  buildPrize,
  buildSweepstakes
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { renderWithParticipation } from './participation-fixtures';
import type { GiveawayFormAudience } from '@giveaway/sweepstakes-model/schemas';

const renderTerms = ({
  terms,
  audience = {}
}: {
  terms?: GiveawayTerms;
  audience?: Partial<GiveawayFormAudience>;
} = {}) => {
  const base = buildSweepstakes({
    prizes: [
      buildPrize({ id: 'prize-1', name: 'Gaming Headset', quota: 1 }),
      buildPrize({ id: 'prize-2', name: 'Gift Card', quota: 3 })
    ],
    audience: buildAudience(audience)
  });
  return renderWithParticipation(
    <TermsModal>
      <button>Terms & Conditions</button>
    </TermsModal>,
    { sweepstakes: { ...base, terms: terms ?? base.terms } }
  );
};

const openTerms = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Terms & Conditions' }));
  return { user, dialog: screen.getByRole('dialog') };
};

describe('TermsModal', () => {
  it('keeps the terms closed until the trigger is clicked', () => {
    renderTerms();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders custom terms as rich text', async () => {
    renderTerms({
      terms: { type: 'CUSTOM', text: '<p>Be <strong>nice</strong>.</p>' }
    });
    const { dialog } = await openTerms();
    expect(dialog).toHaveAccessibleName('Terms & Conditions');
    expect(screen.getByText('nice').tagName).toBe('STRONG');
  });

  describe('template terms', () => {
    it('fills in the sponsor, dates and prizes of the giveaway', async () => {
      renderTerms();
      const { dialog } = await openTerms();
      expect(dialog).toHaveTextContent(
        'The Sweepstakes (“Promotion”) is sponsored by Giveaway Sponsor (“Sponsor”).'
      );
      expect(dialog).toHaveTextContent(
        'The Promotion begins on September 24, 2026 and ends on October 8, 2026.'
      );
      expect(dialog).toHaveTextContent(
        "1 winner will receive 'Gaming Headset'"
      );
      expect(dialog).toHaveTextContent("3 winners will receive 'Gift Card'");
      expect(dialog).toHaveTextContent(`Enter via ${window.location.href}.`);
    });

    it('is open globally to all individuals without restrictions', async () => {
      renderTerms();
      const { dialog } = await openTerms();
      expect(dialog).toHaveTextContent(
        'The Promotion is open Global to all individuals'
      );
    });

    it('lists included regions by their raw codes', async () => {
      renderTerms({
        audience: {
          regionalRestriction: {
            filter: 'INCLUDE',
            regions: ['country:US', 'country:CA']
          }
        }
      });
      const { dialog } = await openTerms();
      expect(dialog).toHaveTextContent(
        'The Promotion is open to residents of: country:US, country:CA'
      );
    });

    it('lists excluded regions by their raw codes', async () => {
      renderTerms({
        audience: {
          regionalRestriction: { filter: 'EXCLUDE', regions: ['continent:EU'] }
        }
      });
      const { dialog } = await openTerms();
      expect(dialog).toHaveTextContent(
        'The Promotion is open globally (excluding: continent:EU)'
      );
    });

    it('uses the minimum age of the age field', async () => {
      renderTerms({
        audience: { formFields: [buildAgeField({ minimum: 21 })] }
      });
      const { dialog } = await openTerms();
      expect(dialog).toHaveTextContent('to individuals 21+ years of age');
    });

    it('prints null when the age field has no minimum', async () => {
      renderTerms({
        audience: { formFields: [buildAgeField({ minimum: null })] }
      });
      const { dialog } = await openTerms();
      expect(dialog).toHaveTextContent('to individuals null+ years of age');
    });
  });

  it('closes when the footer close button is clicked', async () => {
    renderTerms();
    const { user } = await openTerms();
    const footerClose = screen
      .getAllByRole('button', { name: 'Close' })
      .find((button) => button.getAttribute('data-slot') === 'button');
    await user.click(footerClose as HTMLElement);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
