import { render } from '@testing-library/react';
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
});
