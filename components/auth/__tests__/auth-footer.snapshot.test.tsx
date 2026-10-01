import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthFooter } from '../auth-footer';

describe('AuthFooter', () => {
  it('matches the snapshot', () => {
    const { container } = render(<AuthFooter />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
