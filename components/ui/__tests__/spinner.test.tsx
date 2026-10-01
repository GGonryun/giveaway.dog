import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from '../spinner';

describe('Spinner', () => {
  it('renders a spinning icon with the small size by default', () => {
    const { container } = render(<Spinner />);
    const icon = container.querySelector('svg');
    expect(icon).toHaveClass('animate-spin', 'h-6', 'w-6');
  });

  it.each([
    ['3xs', 'h-2'],
    ['2xs', 'h-3'],
    ['xs', 'h-4'],
    ['sm', 'h-6'],
    ['md', 'h-8'],
    ['lg', 'h-10'],
    ['xl', 'h-12'],
    ['2xl', 'h-16'],
    ['3xl', 'h-24']
  ] as const)('applies the %s size', (size, className) => {
    const { container } = render(<Spinner size={size} />);
    expect(container.querySelector('svg')).toHaveClass(
      'animate-spin',
      className
    );
  });

  it('merges a custom class name', () => {
    const { container } = render(<Spinner className="text-primary" />);
    expect(container.querySelector('svg')).toHaveClass(
      'animate-spin',
      'text-primary'
    );
  });
});
