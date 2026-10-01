import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SocialLinkIcon } from '../social-link-icon';

describe('SocialLinkIcon', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <SocialLinkIcon platform="discord" url="https://discord.gg/doggo" />
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
