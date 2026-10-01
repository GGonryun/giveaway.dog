import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MorePowerfulGiveawaysCTA, MoreToolsCTA } from '../more-tools-cta';

describe('MorePowerfulGiveawaysCTA', () => {
  it('matches the snapshot', () => {
    const { container } = render(<MorePowerfulGiveawaysCTA />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('MoreToolsCTA', () => {
  it('matches the snapshot', () => {
    const { container } = render(<MoreToolsCTA />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
