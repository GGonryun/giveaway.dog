import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ParticipationPageCTAs } from '../participation-page-ctas';

describe('ParticipationPageCTAs', () => {
  it('invites the visitor to discover more giveaways', () => {
    render(<ParticipationPageCTAs />);
    expect(
      screen.getByRole('heading', { name: 'Discover More Opportunities' })
    ).toBeInTheDocument();
  });

  it.each([
    ['🎯 Browse More', '/browse'],
    ['🚀 Create Your Own', '/login'],
    ['📧 Get Updates', '/newsletter']
  ])('links "%s" to %s', (name, href) => {
    render(<ParticipationPageCTAs />);
    expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
  });
});
