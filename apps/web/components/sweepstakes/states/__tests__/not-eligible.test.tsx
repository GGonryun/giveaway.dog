import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotEligible } from '../not-eligible';
import {
  buildAgeField,
  buildAudience,
  buildSweepstakes,
  buildUsernameField
} from '@/components/sweepstakes/__tests__/fixtures';
import { renderWithParticipation } from '@/components/sweepstakes/__tests__/participation-fixtures';
import type { GiveawayFormAudience } from '@/schemas/giveaway/schemas';

const renderNotEligible = (audience: Partial<GiveawayFormAudience>) =>
  renderWithParticipation(<NotEligible />, {
    state: 'not-eligible',
    sweepstakes: buildSweepstakes({ audience: buildAudience(audience) })
  });

describe('NotEligible', () => {
  it('tells the user they are not eligible', () => {
    renderNotEligible({});
    expect(
      screen.getByText('You are not eligible to participate in this giveaway.')
    ).toBeInTheDocument();
  });

  describe('when the audience has an age field with a minimum', () => {
    it('lists the minimum age requirement', () => {
      renderNotEligible({ formFields: [buildAgeField({ minimum: 21 })] });
      const list = screen.getByRole('list');
      expect(within(list).getAllByRole('listitem')).toHaveLength(1);
      expect(list).toHaveTextContent('Must be at least 21 years old');
    });
  });

  describe('when the age field has no minimum', () => {
    it('does not list an age requirement', () => {
      renderNotEligible({ formFields: [buildAgeField({ minimum: null })] });
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Eligibility requirements:')
      ).not.toBeInTheDocument();
    });
  });

  describe('when the audience only includes some regions', () => {
    it('lists the readable names of the included regions', () => {
      renderNotEligible({
        regionalRestriction: {
          filter: 'INCLUDE',
          regions: ['country:US', 'continent:EU']
        }
      });
      expect(screen.getByRole('listitem')).toHaveTextContent(
        'Only available in: United States of America, Europe'
      );
    });
  });

  describe('when the audience excludes some regions', () => {
    it('lists the readable names of the excluded regions', () => {
      renderNotEligible({
        regionalRestriction: { filter: 'EXCLUDE', regions: ['country:DE'] }
      });
      expect(screen.getByRole('listitem')).toHaveTextContent(
        'Not available in: Germany'
      );
    });
  });

  describe('when the audience has both restrictions', () => {
    it('lists the age requirement before the regional requirement', () => {
      renderNotEligible({
        formFields: [buildUsernameField(), buildAgeField({ minimum: 18 })],
        regionalRestriction: { filter: 'EXCLUDE', regions: ['country:CA'] }
      });
      const items = screen.getAllByRole('listitem');
      expect(items.map((item) => item.textContent)).toEqual([
        'Must be at least 18 years old',
        'Not available in: Canada'
      ]);
    });
  });

  describe('when the audience has no restrictions', () => {
    it('does not render the requirements section', () => {
      renderNotEligible({ formFields: [buildUsernameField()] });
      expect(
        screen.queryByText('Eligibility requirements:')
      ).not.toBeInTheDocument();
    });
  });

  it('links to the support page', () => {
    renderNotEligible({});
    expect(screen.getByRole('link', { name: 'support' })).toHaveAttribute(
      'href',
      '/contact'
    );
  });
});
