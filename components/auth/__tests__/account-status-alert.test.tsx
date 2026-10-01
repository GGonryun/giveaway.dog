import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AccountStatusAlert } from '../account-status-alert';

describe('AccountStatusAlert', () => {
  it('renders nothing when the account is active', () => {
    const { container } = render(
      <AccountStatusAlert status="ACTIVE" providerLabel="Discord" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('asks the user to reconnect the named provider when the account has an error', () => {
    render(<AccountStatusAlert status="ERROR" providerLabel="Discord" />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your Discord connection has expired or been revoked. Please reconnect your account to continue.'
    );
  });

  it('uses the destructive alert style', () => {
    render(<AccountStatusAlert status="ERROR" providerLabel="X (Twitter)" />);
    expect(screen.getByRole('alert')).toHaveClass(
      'text-destructive',
      'text-left'
    );
  });

  it('matches the snapshot for an errored account', () => {
    const { container } = render(
      <AccountStatusAlert status="ERROR" providerLabel="Twitch" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
