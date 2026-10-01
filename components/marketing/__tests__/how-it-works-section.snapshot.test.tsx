import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HowItWorksSection } from '../how-it-works-section';

describe('HowItWorksSection', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <HowItWorksSection
        title="How it works"
        steps={[
          { title: 'Connect', description: 'Link your social accounts.' },
          { title: 'Create', description: 'Pick a template and prizes.' },
          { title: 'Launch', description: 'Share the giveaway link.' }
        ]}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
