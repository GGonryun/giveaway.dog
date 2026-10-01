import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AvatarGroupEasterEgg } from '../avatar-group-easter-egg';

const hosts = ['ebidi', 'kurozzz', 'h7', 'tj', 'lv', 'toniii', 'szamer'].map(
  (label) => ({
    label,
    fallback: label.slice(0, 2).toUpperCase(),
    image: `/hosts/${label}.jpg`
  })
);

describe('AvatarGroupEasterEgg', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <AvatarGroupEasterEgg hosts={hosts.slice(0, 2)} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
