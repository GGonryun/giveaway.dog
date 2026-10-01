import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, buttonVariants } from '../button';

describe('Button', () => {
  it.each([
    'default',
    'success',
    'destructive',
    'warning',
    'outline',
    'secondary',
    'ghost',
    'link'
  ] as const)('matches the snapshot for the %s variant', (variant) => {
    const { container } = render(<Button variant={variant}>Go</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders a button element with the data-slot attribute', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('data-slot', 'button');
  });

  it('merges a custom class name with the variant classes', () => {
    render(
      <Button variant="outline" size="sm" className="w-full">
        Save
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('w-full', 'border', 'h-8');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders its child element when asChild is set', () => {
    render(
      <Button asChild variant="link">
        <a href="https://example.com">Browse</a>
      </Button>
    );
    const link = screen.getByRole('link', { name: 'Browse' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('data-slot', 'button');
    expect(link).toHaveClass('underline-offset-4');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('buttonVariants', () => {
  it('uses the default variant and size when none are given', () => {
    const classes = buttonVariants();
    expect(classes).toContain('bg-primary');
    expect(classes).toContain('h-9');
  });
});
