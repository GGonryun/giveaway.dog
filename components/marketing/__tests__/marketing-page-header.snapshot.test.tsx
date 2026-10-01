import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarketingPageHeader } from '../marketing-page-header';

describe('MarketingPageHeader', () => {
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
