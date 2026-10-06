import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MinimalTipTapPreview } from '../minimal-tiptap-preview';

describe('MinimalTipTapPreview', () => {
  it.each([undefined, null, ''])(
    'renders nothing for %o content',
    (content) => {
      const { container } = render(<MinimalTipTapPreview content={content} />);
      expect(container).toBeEmptyDOMElement();
    }
  );

  it('renders the HTML content', () => {
    render(
      <MinimalTipTapPreview content="<h2>Prize</h2><ul><li>A bike</li><li>A helmet</li></ul>" />
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Prize' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('applies the rich text preview styles and merges a custom class name', () => {
    const { container } = render(
      <MinimalTipTapPreview content="<p>Hello</p>" className="mt-2" />
    );
    expect(container.firstChild).toHaveClass(
      'prose',
      'text-sm',
      'sm:text-base',
      '[&_a]:break-all',
      'mt-2'
    );
  });

  it('strips event handlers and javascript links but keeps the markup', () => {
    const { container } = render(
      <MinimalTipTapPreview
        content={
          '<p style="text-align: center" onclick="alert(1)">Win a <strong>bike</strong></p><img src="x.png" alt="Prize" onerror="alert(1)"><a href="javascript:alert(1)">Claim</a><a href="https://giveaway.dog" target="_blank" rel="noopener noreferrer nofollow">Rules</a><script>alert(1)</script>'
        }
      />
    );
    const paragraph = container.querySelector('p');
    expect(paragraph).toHaveStyle({ textAlign: 'center' });
    expect(paragraph).not.toHaveAttribute('onclick');
    expect(screen.getByText('bike').tagName).toBe('STRONG');
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('[onerror]')).not.toBeInTheDocument();
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(screen.getByText('Claim')).not.toHaveAttribute('href');
    expect(screen.getByRole('link', { name: 'Rules' })).toHaveAttribute(
      'href',
      'https://giveaway.dog'
    );
  });
});
