import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmojiLogo } from '../emoji-logo';

describe('EmojiLogo', () => {
  it('matches the snapshot', () => {
    const { container } = render(<EmojiLogo className="text-3xl" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
