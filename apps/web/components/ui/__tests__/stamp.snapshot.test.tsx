import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stamp } from '../stamp';

describe('Stamp', () => {
  it.each(['check', 'error', 'info'] as const)(
    'matches the snapshot for the %s variant',
    (variant) => {
      const { container } = render(<Stamp variant={variant} />);
      expect(container.firstChild).toMatchSnapshot();
    }
  );
});
