import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge, badgeVariants } from '../badge';

describe('Badge', () => {
  it.each([
    'default',
    'secondary',
    'destructive',
    'info',
    'warning',
    'outline',
    'success'
  ] as const)('matches the snapshot for the %s variant', (variant) => {
    const { container } = render(<Badge variant={variant}>New</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders a span with the data-slot attribute', () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText('New');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveAttribute('data-slot', 'badge');
  });

  it('merges a custom class name with the variant classes', () => {
    render(
      <Badge variant="success" className="uppercase">
        Live
      </Badge>
    );
    expect(screen.getByText('Live')).toHaveClass(
      'uppercase',
      'bg-success',
      'rounded-md'
    );
  });

  it('forwards other props to the element', () => {
    render(
      <Badge title="Entries" aria-label="12 entries">
        12
      </Badge>
    );
    const badge = screen.getByLabelText('12 entries');
    expect(badge).toHaveAttribute('title', 'Entries');
  });

  it('renders its child element when asChild is set', () => {
    render(
      <Badge asChild variant="outline">
        <a href="https://example.com">Docs</a>
      </Badge>
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('data-slot', 'badge');
    expect(link).toHaveClass('text-foreground');
  });
});

describe('badgeVariants', () => {
  it('uses the default variant when none is given', () => {
    expect(badgeVariants()).toContain('bg-primary');
  });

  it('returns the classes of the requested variant', () => {
    const classes = badgeVariants({ variant: 'warning' });
    expect(classes).toContain('bg-warning');
    expect(classes).not.toContain('bg-primary');
  });
});
