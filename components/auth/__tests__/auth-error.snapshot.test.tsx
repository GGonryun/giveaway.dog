import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthError } from '../auth-error';

describe('AuthError', () => {
  it('matches the snapshot', () => {
    const { container } = render(<AuthError error="OAuthAccountNotLinked" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
