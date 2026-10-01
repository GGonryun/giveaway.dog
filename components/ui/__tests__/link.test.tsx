import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Link } from '../link';

describe('Link', () => {
  it('renders an anchor for the href', () => {
    render(<Link href="https://example.com/giveaways">Giveaways</Link>);
    expect(screen.getByRole('link', { name: 'Giveaways' })).toHaveAttribute(
      'href',
      'https://example.com/giveaways'
    );
  });

  it('builds the href from a url object', () => {
    render(
      <Link href={{ pathname: '/browse', query: { page: 2 } }}>Browse</Link>
    );
    expect(screen.getByRole('link', { name: 'Browse' })).toHaveAttribute(
      'href',
      '/browse?page=2'
    );
  });

  it('forwards other anchor props', () => {
    render(
      <Link
        href="https://example.com"
        target="_blank"
        rel="noreferrer"
        aria-label="Open the docs"
      >
        Docs
      </Link>
    );
    const link = screen.getByRole('link', { name: 'Open the docs' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('drops the className prop', () => {
    render(
      <Link href="https://example.com" className="underline">
        Docs
      </Link>
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).not.toHaveClass('underline');
    expect(link).not.toHaveAttribute('class');
  });

  it('passes the href to its child element when asChild is set', () => {
    render(
      <Link href="https://example.com/docs" asChild>
        <a data-variant="button">Docs</a>
      </Link>
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('data-variant', 'button');
  });
});
