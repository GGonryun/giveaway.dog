import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteHeader, SiteHeaderTitle } from '../site-header';

const breadcrumbTitle = [
  { label: 'Acme', href: '/app/acme' },
  { label: 'Settings', href: '/app/acme/settings' },
  { label: 'Billing' }
];

describe('SiteHeader', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <SiteHeader>
        <span>Dashboard</span>
      </SiteHeader>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('SiteHeaderTitle', () => {
  it('matches the snapshot for breadcrumbs', () => {
    const { container } = render(<SiteHeaderTitle title={breadcrumbTitle} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
