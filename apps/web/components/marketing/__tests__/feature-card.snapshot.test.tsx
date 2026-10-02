import { render } from '@testing-library/react';
import { ShieldIcon } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { FeatureCard } from '../feature-card';

describe('FeatureCard', () => {
  it('matches the snapshot without an action', () => {
    const { container } = render(
      <FeatureCard
        icon={ShieldIcon}
        title="Fraud detection"
        description="Only real people can enter."
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches the snapshot with an action', () => {
    const { container } = render(
      <FeatureCard
        icon={ShieldIcon}
        title="Fraud detection"
        description="Only real people can enter."
        action={<span>Included in every plan</span>}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
