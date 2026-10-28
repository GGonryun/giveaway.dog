import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Progress } from '../progress';

function getIndicator() {
  return screen.getByRole('progressbar').firstElementChild as HTMLElement;
}

describe('Progress', () => {
  it('renders a progress bar', () => {
    render(<Progress value={40} aria-label="Upload progress" />);
    expect(
      screen.getByRole('progressbar', { name: 'Upload progress' })
    ).toHaveClass('rounded-full', 'bg-secondary');
  });

  it.each([
    [0, 'translateX(-100%)'],
    [25, 'translateX(-75%)'],
    [100, 'translateX(-0%)']
  ])('offsets the indicator for a value of %i', (value, transform) => {
    render(<Progress value={value} />);
    expect(getIndicator().style.transform).toBe(transform);
  });

  it('treats a missing value as empty', () => {
    render(<Progress />);
    expect(getIndicator().style.transform).toBe('translateX(-100%)');
  });

  it('animates the indicator when indeterminate', () => {
    render(<Progress indeterminate />);
    expect(getIndicator()).toHaveClass('animate-progress', 'origin-left');
  });

  it('applies custom root and indicator class names', () => {
    render(
      <Progress value={10} className="h-2" indicatorClassName="bg-success" />
    );
    expect(screen.getByRole('progressbar')).toHaveClass('h-2');
    expect(getIndicator()).toHaveClass('bg-success');
    expect(getIndicator()).not.toHaveClass('bg-primary');
  });

  it('exposes the value to assistive technology', () => {
    render(<Progress value={40} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '40');
    expect(progressbar).toHaveAttribute('aria-valuetext', '40%');
    expect(progressbar).toHaveAttribute('data-state', 'loading');
  });

  it('reports a full bar as complete', () => {
    render(<Progress value={100} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'data-state',
      'complete'
    );
  });

  it('reports an indeterminate bar without a value', () => {
    render(<Progress value={40} indeterminate />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).not.toHaveAttribute('aria-valuenow');
    expect(progressbar).toHaveAttribute('data-state', 'indeterminate');
  });
});
