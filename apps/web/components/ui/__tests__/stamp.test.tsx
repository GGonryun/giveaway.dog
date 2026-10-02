import { render } from '@testing-library/react';
import {
  CheckIcon,
  CircleAlertIcon,
  CircleIcon,
  CircleXIcon
} from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Stamp, StampVariant, stampIcon } from '../stamp';

describe('stampIcon', () => {
  it.each([
    ['check', CheckIcon],
    ['error', CircleXIcon],
    ['info', CircleAlertIcon]
  ] as const)(
    'returns the matching icon for the %s variant',
    (variant, icon) => {
      expect(stampIcon(variant)).toBe(icon);
    }
  );

  it.each([undefined, null])('returns a plain circle for %s', (variant) => {
    expect(stampIcon(variant)).toBe(CircleIcon);
  });

  it('throws for an unknown variant', () => {
    expect(() => stampIcon('pending' as unknown as StampVariant)).toThrow(
      'Unexpected value: pending'
    );
  });
});

describe('Stamp', () => {
  it.each([
    ['check', 'bg-success'],
    ['error', 'bg-error'],
    ['info', 'bg-info/80']
  ] as const)('colors the %s variant with %s', (variant, className) => {
    const { container } = render(<Stamp variant={variant} />);
    expect(container.querySelector('svg')).toHaveClass(
      className,
      'rounded-full',
      'text-white'
    );
  });

  it('uses the small size by default', () => {
    const { container } = render(<Stamp variant="check" />);
    expect(container.querySelector('svg')).toHaveClass('h-6', 'w-6');
  });

  it('applies a custom size and class name', () => {
    const { container } = render(
      <Stamp variant="info" size="lg" className="shadow" />
    );
    expect(container.querySelector('svg')).toHaveClass(
      'h-10',
      'w-10',
      'shadow'
    );
  });

  it('renders an uncolored circle without a variant', () => {
    const { container } = render(<Stamp />);
    const icon = container.querySelector('svg');
    expect(icon).toHaveClass('rounded-full');
    expect(icon).not.toHaveClass('bg-success');
    expect(icon).not.toHaveClass('bg-error');
  });
});
