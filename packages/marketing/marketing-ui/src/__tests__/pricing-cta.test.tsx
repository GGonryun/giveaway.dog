import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CallToAction } from '../pricing-cta';

describe('CallToAction', () => {
  it('asks whether the visitor is ready to save time', () => {
    render(<CallToAction />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Ready to save time?' })
    ).toBeInTheDocument();
    expect(screen.getByText('save time')).toHaveClass('text-primary');
  });

  it('links to sign up and the demo', () => {
    render(<CallToAction />);
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute(
      'href',
      '/login'
    );
    expect(screen.getByRole('link', { name: 'Try The Demo' })).toHaveAttribute(
      'href',
      '/demo/sweepstakes'
    );
  });
});
