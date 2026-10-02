import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { GiveawayTerms } from '@/schemas/giveaway/schemas';
import { TermsModal } from '../terms-modal';
import {
  buildAudience,
  buildPrize,
  buildSweepstakes,
  renderWithParticipation,
  withStableIds
} from './fixtures';
import type { GiveawayFormAudience } from '@/schemas/giveaway/schemas';

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
  it('matches the snapshot for custom terms', async () => {
    renderTerms({
      terms: { type: 'CUSTOM', text: '<p>Be <strong>nice</strong>.</p>' }
    });
    const { dialog } = await openTerms();
    expect(withStableIds(dialog)).toMatchSnapshot();
  });
});
