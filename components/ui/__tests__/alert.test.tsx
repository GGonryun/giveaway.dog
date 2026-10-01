import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert, AlertDescription, AlertTitle } from '../alert';

describe('Alert', () => {
  it.each([
    'default',
    'primary',
    'destructive',
    'info',
    'success',
    'warning'
  ] as const)('matches the snapshot for the %s variant', (variant) => {
    const { container } = render(<Alert variant={variant}>Saved</Alert>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches the snapshot with a title and a description', () => {
    const { container } = render(
      <Alert>
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Your giveaway ends soon.</AlertDescription>
      </Alert>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('announces its title and description through the alert role', () => {
    render(
      <Alert>
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Your giveaway ends soon.</AlertDescription>
      </Alert>
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Heads upYour giveaway ends soon.');
    expect(alert).toHaveAttribute('data-slot', 'alert');
  });

  it('uses the default variant when none is given', () => {
    render(<Alert>Saved</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-card', 'text-muted-foreground');
    expect(alert).not.toHaveClass('text-card-foreground');
  });

  it('replaces the card background with the variant tint', () => {
    render(<Alert variant="destructive">Failed</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass(
      'text-destructive',
      'bg-destructive/10',
      'border-destructive/50'
    );
    expect(alert).not.toHaveClass('bg-card');
  });

  it('merges a custom class name', () => {
    render(<Alert className="mt-4">Saved</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('mt-4', 'rounded-lg');
  });
});

describe('AlertTitle and AlertDescription', () => {
  it('mark their slots and merge custom class names', () => {
    render(
      <Alert>
        <AlertTitle className="uppercase">Heads up</AlertTitle>
        <AlertDescription className="italic">Body</AlertDescription>
      </Alert>
    );
    const title = screen.getByText('Heads up');
    const description = screen.getByText('Body');
    expect(title).toHaveAttribute('data-slot', 'alert-title');
    expect(title).toHaveClass('uppercase', 'font-medium', 'col-start-2');
    expect(description).toHaveAttribute('data-slot', 'alert-description');
    expect(description).toHaveClass('italic', 'col-start-2');
  });
});
