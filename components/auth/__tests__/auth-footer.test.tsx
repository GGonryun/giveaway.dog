import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthFooter } from '../auth-footer';

describe('AuthFooter', () => {
  it('links to the terms of service', () => {
    render(<AuthFooter />);
    expect(
      screen.getByRole('link', { name: 'Terms of Service' })
    ).toHaveAttribute('href', '/terms');
  });

  it('links to the privacy policy', () => {
    render(<AuthFooter />);
    expect(
      screen.getByRole('link', { name: 'Privacy Policy' })
    ).toHaveAttribute('href', '/privacy');
  });

  it('tells the user that continuing means agreeing to both policies', () => {
    const { container } = render(<AuthFooter />);
    expect(container).toHaveTextContent(
      'By clicking continue, you agree to our Terms of Service and Privacy Policy.'
    );
  });
});
