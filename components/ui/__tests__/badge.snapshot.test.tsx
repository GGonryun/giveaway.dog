import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '../badge';

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
});
