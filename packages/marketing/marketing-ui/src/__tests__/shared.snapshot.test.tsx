import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarketingHeader } from '../shared';

describe('MarketingHeader', () => {
  const title = { text: 'Pick winners fairly', highlight: 'fairly' };
  const subtitle = { text: 'Random, verified and transparent.' };

  it('matches the snapshot', () => {
    const { container } = render(
      <MarketingHeader
        title={title}
        subtitle={subtitle}
        actions={[
          { label: 'Giveaways', href: '/browse', variant: 'outline' },
          { label: 'Try it for free', href: '/demo/sweepstakes' }
        ]}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
