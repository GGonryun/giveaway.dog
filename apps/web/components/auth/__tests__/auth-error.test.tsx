import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthError, parseError } from '../auth-error';

describe('parseError', () => {
  it.each([null, ''])(
    'returns the generic message when the error is %j',
    (error) => {
      expect(parseError(error)).toBe(
        'An unknown error occurred. Please try again.'
      );
    }
  );

  it.each([
    [
      'OAuthCallbackError',
      'There was an error connecting to your account. Please try again.'
    ],
    [
      'OAuthAccountNotLinked',
      'Another account already exists with the same e-mail address. Please use a different login method or contact support.'
    ]
  ])('maps the %s code to a friendly message', (code, message) => {
    expect(parseError(code)).toBe(message);
  });

  it('returns an unrecognised error unchanged', () => {
    expect(parseError('Please enter a valid email address.')).toBe(
      'Please enter a valid email address.'
    );
  });
});

describe('AuthError', () => {
  it.each([undefined, null, ''])(
    'renders nothing when the error is %j',
    (error) => {
      const { container } = render(<AuthError error={error} />);
      expect(container).toBeEmptyDOMElement();
    }
  );

  it('shows the friendly message for a known error code', () => {
    render(<AuthError error="OAuthCallbackError" />);
    expect(
      screen.getByText(
        'There was an error connecting to your account. Please try again.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('OAuthCallbackError')).not.toBeInTheDocument();
  });

  it('announces the message through a polite, atomic live region', () => {
    render(<AuthError error="Something broke" />);
    const region = screen.getByText('Something broke').parentElement;
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
  });
});
