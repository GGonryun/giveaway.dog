import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '../button';

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
});
