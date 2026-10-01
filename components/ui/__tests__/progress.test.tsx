import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Progress } from '../progress';

function getIndicator() {
  return screen.getByRole('progressbar').firstElementChild as HTMLElement;
}

describe('Progress', () => {
  it('matches the snapshot', () => {
    const { container } = render(<Progress value={40} />);
    expect(container.firstChild).toMatchSnapshot();
  });

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

  it('does not expose the value to assistive technology', () => {
    render(<Progress value={40} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).not.toHaveAttribute('aria-valuenow');
    expect(progressbar).toHaveAttribute('data-state', 'indeterminate');
  });
});
