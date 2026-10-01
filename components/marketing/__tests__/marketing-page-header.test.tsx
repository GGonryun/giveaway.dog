import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarketingPageHeader } from '../marketing-page-header';

describe('MarketingPageHeader', () => {
  it('renders the title as a level one heading by default', () => {
    render(
      <MarketingPageHeader title="Pricing" description="Plans for everyone" />
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Pricing' })
    ).toBeInTheDocument();
  });

  it('renders the title with a custom element', () => {
    render(
      <MarketingPageHeader
        title="Pricing"
        description="Plans for everyone"
        component="h2"
      />
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Pricing' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('accepts rich content as the title', () => {
    render(
      <MarketingPageHeader
        title={
          <>
            Grow your <span className="text-primary">community</span>
          </>
        }
        description="Plans for everyone"
      />
    );
    expect(
      screen.getByRole('heading', { name: 'Grow your community' })
    ).toBeInTheDocument();
    expect(screen.getByText('community')).toHaveClass('text-primary');
  });

  it('renders the description as a paragraph', () => {
    render(
      <MarketingPageHeader title="Pricing" description="Plans for everyone" />
    );
    expect(screen.getByText('Plans for everyone').tagName).toBe('P');
  });

  it('matches the snapshot', () => {
    const { container } = render(
      <MarketingPageHeader
        title="Frequently Asked Questions"
        description="Everything you need to know"
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
