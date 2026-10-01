import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Separator } from '../separator';

describe('Separator', () => {
  it('matches the snapshot for the horizontal orientation', () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches the snapshot for the vertical orientation', () => {
    const { container } = render(<Separator orientation="vertical" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('is decorative by default and hidden from assistive technology', () => {
    render(<Separator data-testid="separator" />);
    expect(screen.getByTestId('separator')).toHaveAttribute('role', 'none');
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('exposes the separator role when it is not decorative', () => {
    render(<Separator decorative={false} orientation="vertical" />);
    expect(screen.getByRole('separator')).toHaveAttribute(
      'aria-orientation',
      'vertical'
    );
  });

  it('sets the orientation and slot data attributes', () => {
    render(<Separator data-testid="separator" orientation="vertical" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
    expect(separator).toHaveAttribute('data-slot', 'separator');
  });

  it('merges a custom class name', () => {
    render(<Separator data-testid="separator" className="my-4" />);
    expect(screen.getByTestId('separator')).toHaveClass('my-4', 'bg-border');
  });
});
