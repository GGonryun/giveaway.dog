import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PricingSection } from '../pricing-section';

const tierCard = (title: string) =>
  screen
    .getByRole('heading', { level: 3, name: title })
    .closest('[data-slot="card"]') as HTMLElement;

const chooseBilling = (cycle: 'Monthly' | 'Yearly') =>
  userEvent.click(screen.getByRole('button', { name: cycle }));

describe('PricingSection', () => {
  it('anchors the section for in-page links', () => {
    const { container } = render(<PricingSection />);
    expect(container.firstChild).toHaveAttribute('id', 'pricing');
  });

  it('introduces the plans with a highlighted heading', () => {
    render(<PricingSection />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Get more views with less effort'
      })
    ).toBeInTheDocument();
    expect(screen.getByText('with less effort')).toHaveClass('text-primary');
  });

  it('advertises the yearly discount on the billing toggle', () => {
    render(<PricingSection />);
    expect(screen.getByText('Save 25%')).toBeInTheDocument();
  });

  describe('Creator tier', () => {
    it('is free with no credit card required', () => {
      render(<PricingSection />);
      const creator = within(tierCard('Creator'));
      expect(creator.getByText('Free')).toBeInTheDocument();
      expect(creator.getByText('No credit card required')).toBeInTheDocument();
      expect(creator.getByText('Beta')).toBeInTheDocument();
    });

    it('lists the free plan limits', () => {
      render(<PricingSection />);
      const creator = within(tierCard('Creator'));
      expect(
        creator.getByText('Up to 3 concurrent giveaways')
      ).toBeInTheDocument();
      expect(creator.getByText('Unlisted giveaways only')).toBeInTheDocument();
    });

    it('links to sign up for free', () => {
      render(<PricingSection />);
      expect(
        within(tierCard('Creator')).getByRole('link', {
          name: 'Get Started for Free'
        })
      ).toHaveAttribute('href', '/login');
    });

    it('stays free when billed yearly', async () => {
      render(<PricingSection />);
      await chooseBilling('Yearly');
      expect(within(tierCard('Creator')).getByText('Free')).toBeInTheDocument();
    });
  });

  describe('Pro tier', () => {
    it('costs $20 a month when billed monthly', () => {
      render(<PricingSection />);
      const pro = within(tierCard('Pro'));
      expect(pro.getByText('$20')).toBeInTheDocument();
      expect(pro.getByText('/month')).toBeInTheDocument();
      expect(pro.queryByText(/Billed as/)).not.toBeInTheDocument();
      expect(pro.queryByText('25% OFF')).not.toBeInTheDocument();
    });

    it('costs $15 a month billed as $180 a year when billed yearly', async () => {
      render(<PricingSection />);
      await chooseBilling('Yearly');
      const pro = within(tierCard('Pro'));
      expect(pro.getByText('$15')).toBeInTheDocument();
      expect(pro.getByText('Billed as $180.00/year')).toBeInTheDocument();
      expect(pro.getByText('Save $60.00/year (25% off)')).toBeInTheDocument();
      expect(pro.getByText('25% OFF')).toBeInTheDocument();
    });

    it('returns to the monthly price when switching back', async () => {
      render(<PricingSection />);
      await chooseBilling('Yearly');
      await chooseBilling('Monthly');
      const pro = within(tierCard('Pro'));
      expect(pro.getByText('$20')).toBeInTheDocument();
      expect(pro.queryByText('25% OFF')).not.toBeInTheDocument();
    });

    it('highlights the unlimited features', () => {
      render(<PricingSection />);
      expect(
        within(tierCard('Pro')).getByText('Unlimited giveaways')
      ).toHaveClass('bg-clip-text');
    });

    it('is marked as the best deal with a primary border', () => {
      render(<PricingSection />);
      expect(
        within(tierCard('Pro')).getByText('Best deal')
      ).toBeInTheDocument();
      expect(tierCard('Pro')).toHaveClass('border-primary');
      expect(tierCard('Creator')).not.toHaveClass('border-primary');
    });

    it('links the contact button to the login page', () => {
      render(<PricingSection />);
      expect(
        within(tierCard('Pro')).getByRole('link', { name: 'Contact Us' })
      ).toHaveAttribute('href', '/login');
    });
  });

  it('styles the selected billing cycle', async () => {
    render(<PricingSection />);
    expect(screen.getByRole('button', { name: 'Monthly' })).toHaveClass(
      'bg-background'
    );
    await chooseBilling('Yearly');
    expect(screen.getByRole('button', { name: 'Yearly' })).toHaveClass(
      'bg-background'
    );
    expect(screen.getByRole('button', { name: 'Monthly' })).not.toHaveClass(
      'bg-background'
    );
  });

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
