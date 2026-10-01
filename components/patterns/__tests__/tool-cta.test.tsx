import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToolCta } from '../tool-cta';

describe('ToolCta', () => {
  it('pitches hosting a giveaway by default', () => {
    render(<ToolCta />);
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Ready to host your own giveaway?'
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Create professional giveaways with entry verification/)
    ).toBeInTheDocument();
  });

  it('links to sign up and the demo by default', () => {
    render(<ToolCta />);
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute(
      'href',
      '/login'
    );
    expect(screen.getByRole('link', { name: 'Try The Demo' })).toHaveAttribute(
      'href',
      '/demo/sweepstakes'
    );
  });

  it('uses custom copy and destinations', () => {
    render(
      <ToolCta
        title="Pick a winner"
        description="Choose a random reply."
        primaryButtonText="Open picker"
        primaryButtonHref="/pickers/x"
        secondaryButtonText="See pricing"
        secondaryButtonHref="/pricing"
      />
    );
    expect(
      screen.getByRole('heading', { name: 'Pick a winner' })
    ).toBeInTheDocument();
    expect(screen.getByText('Choose a random reply.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open picker' })).toHaveAttribute(
      'href',
      '/pickers/x'
    );
    expect(screen.getByRole('link', { name: 'See pricing' })).toHaveAttribute(
      'href',
      '/pricing'
    );
  });

  it('matches the snapshot', () => {
    const { container } = render(<ToolCta />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
