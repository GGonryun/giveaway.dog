import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmojiLogo } from '../emoji-logo';

describe('EmojiLogo', () => {
  it('renders the dog emoji as an accessible image', () => {
    render(<EmojiLogo />);
    expect(screen.getByRole('img', { name: 'dog face' })).toHaveTextContent(
      '🐶'
    );
  });

  it('uses a large font size by default', () => {
    render(<EmojiLogo />);
    expect(screen.getByRole('img')).toHaveClass('text-7xl');
  });

  it('loses the leading-none class to the font size that follows it', () => {
    render(<EmojiLogo />);
    expect(screen.getByRole('img')).not.toHaveClass('leading-none');
  });

  it('lets a custom size replace the default one', () => {
    render(<EmojiLogo className="text-3xl mb-1" />);
    const logo = screen.getByRole('img');
    expect(logo).toHaveClass('text-3xl', 'mb-1');
    expect(logo).not.toHaveClass('text-7xl');
  });

  it('forwards other span props', () => {
    render(<EmojiLogo title="Giveaway.dog" aria-label="Giveaway.dog logo" />);
    const logo = screen.getByRole('img', { name: 'Giveaway.dog logo' });
    expect(logo).toHaveAttribute('title', 'Giveaway.dog');
  });
});
