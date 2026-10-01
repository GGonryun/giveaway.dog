import { render, screen } from '@testing-library/react';
import { ShieldIcon } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { FeatureCard } from '../feature-card';

describe('FeatureCard', () => {
  it('shows the title as a heading with its description', () => {
    render(
      <FeatureCard
        icon={ShieldIcon}
        title="Fraud detection"
        description="Only real people can enter."
      />
    );
    expect(
      screen.getByRole('heading', { level: 3, name: 'Fraud detection' })
    ).toBeInTheDocument();
    expect(screen.getByText('Only real people can enter.')).toBeInTheDocument();
  });

  it('renders the given icon', () => {
    const { container } = render(
      <FeatureCard icon={ShieldIcon} title="Secure" description="Safe." />
    );
    expect(container.querySelector('svg.lucide-shield')).toHaveClass(
      'text-primary'
    );
  });

  it('renders the action when one is provided', () => {
    render(
      <FeatureCard
        icon={ShieldIcon}
        title="Secure"
        description="Safe."
        action={<button type="button">Learn more</button>}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Learn more' }).parentElement
    ).toHaveClass('mt-4');
  });

  it('omits the action wrapper when there is no action', () => {
    const { container } = render(
      <FeatureCard icon={ShieldIcon} title="Secure" description="Safe." />
    );
    expect(container.querySelector('.mt-4')).not.toBeInTheDocument();
  });
});
