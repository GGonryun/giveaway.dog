import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo, LogoImage, LogoText } from '../logo';

describe('Logo', () => {
  it('matches the snapshot with an image and text', () => {
    const { container } = render(
      <Logo url="https://example.com">
        <LogoImage src="https://example.com/logo.svg" alt="Giveaway.dog" />
        <LogoText>Giveaway.dog</LogoText>
      </Logo>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
