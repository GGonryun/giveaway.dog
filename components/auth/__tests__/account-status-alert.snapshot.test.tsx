import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AccountStatusAlert } from '../account-status-alert';

describe('AccountStatusAlert', () => {
  it('matches the snapshot for an errored account', () => {
    const { container } = render(
      <AccountStatusAlert status="ERROR" providerLabel="Twitch" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
