import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PricingSection } from '../pricing-section';

const chooseBilling = (cycle: 'Monthly' | 'Yearly') =>
  userEvent.click(screen.getByRole('button', { name: cycle }));

describe('PricingSection', () => {
  it('matches the snapshot when billed monthly', () => {
    const { container } = render(<PricingSection />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches the snapshot when billed yearly', async () => {
    const { container } = render(<PricingSection />);
    await chooseBilling('Yearly');
    expect(container.firstChild).toMatchSnapshot();
  });
});
