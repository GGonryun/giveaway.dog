import { describe, expect, it } from 'vitest';
import { NotEligible } from '../not-eligible';
import {
  buildAgeField,
  buildAudience,
  buildSweepstakes
} from '@/components/sweepstakes/__tests__/fixtures';
import { renderWithParticipation } from '@/components/sweepstakes/__tests__/participation-fixtures';
import type { GiveawayFormAudience } from '@giveaway/sweepstakes-model/schemas';

const renderNotEligible = (audience: Partial<GiveawayFormAudience>) =>
  renderWithParticipation(<NotEligible />, {
    state: 'not-eligible',
    sweepstakes: buildSweepstakes({ audience: buildAudience(audience) })
  });

describe('NotEligible', () => {
  it('matches the snapshot with age and regional requirements', () => {
    const { container } = renderNotEligible({
      formFields: [buildAgeField({ minimum: 18 })],
      regionalRestriction: {
        filter: 'INCLUDE',
        regions: ['country:US', 'country:CA']
      }
    });
    expect(container.firstChild).toMatchSnapshot();
  });
});
