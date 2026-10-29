import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LinkResultAlert } from '../link-result-alert';

describe('LinkResultAlert', () => {
  it.each([
    [
      'OAuthAccountAlreadyLinked',
      'This account is already linked to a different user. Please use a different account or sign in to the account that owns this connection.'
    ],
    [
      'instagram_link_failed',
      'Failed to link Instagram account. Please try again.'
    ],
    ['something_else', 'An unexpected error occurred. Please try again.']
  ])('[ACCOUNT-010] says why linking failed for %s', (error, description) => {
    render(<LinkResultAlert error={error} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not link your account');
    expect(alert).toHaveTextContent(description);
  });

  it('[ACCOUNT-016] says that an account was merged', () => {
    render(<LinkResultAlert merged />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Accounts merged');
    expect(alert).toHaveTextContent(
      'The account you linked had its own profile, so we merged it into yours.'
    );
  });

  it('shows the error when the link both failed and merged', () => {
    render(<LinkResultAlert error="OAuthAccountAlreadyLinked" merged />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not link your account'
    );
    expect(screen.queryByText('Accounts merged')).not.toBeInTheDocument();
  });

  it('renders nothing without a result', () => {
    const { container } = render(<LinkResultAlert />);

    expect(container).toBeEmptyDOMElement();
  });
});
