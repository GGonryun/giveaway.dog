import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountTabs } from '../account-tabs';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  pathname: '/account'
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

const renderTabs = () =>
  render(
    <AccountTabs>
      <p>Tab content</p>
    </AccountTabs>
  );

describe('AccountTabs', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
    navigation.pathname = '/account';
  });

  it('matches the snapshot', () => {
    const { container } = renderTabs();

    expect(container.firstChild).toMatchSnapshot();
  });
});
