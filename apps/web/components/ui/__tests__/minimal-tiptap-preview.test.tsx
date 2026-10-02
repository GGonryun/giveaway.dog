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

  it('removes event handler attributes from the markup', () => {
    const { container } = render(
      <MinimalTipTapPreview
        content={
          '<p onclick="alert(1)">Prize</p><img src="x.png" alt="Prize" onerror="alert(1)">'
        }
      />
    );
    expect(screen.getByText('Prize')).not.toHaveAttribute('onclick');
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('[onerror]')).not.toBeInTheDocument();
  });

  it('removes script, iframe and style elements', () => {
    const { container } = render(
      <MinimalTipTapPreview
        content={
          '<script>alert(1)</script><iframe src="https://evil.example"></iframe><style>body { display: none; }</style><p>Prize</p>'
        }
      />
    );
    expect(container.querySelector('script, iframe, style')).toBeNull();
    expect(container.firstChild).toHaveTextContent(/^Prize$/);
  });

  it('removes javascript: URLs from links', () => {
    render(
      <MinimalTipTapPreview
        content={'<a href="javascript:alert(1)">Rules</a>'}
      />
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Rules')).not.toHaveAttribute('href');
  });

  it('opens safe links in a new tab without access to the opener', () => {
    render(
      <MinimalTipTapPreview
        content={
          '<a href="https://giveaway.dog/rules" target="_self">Rules</a>'
        }
      />
    );
    const link = screen.getByRole('link', { name: 'Rules' });
    expect(link).toHaveAttribute('href', 'https://giveaway.dog/rules');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow');
  });

  it('keeps the text alignment from the editor and drops other styles', () => {
    render(
      <MinimalTipTapPreview
        content={
          '<p style="text-align: center;">Centered</p><p style="position: fixed; inset: 0">Overlay</p>'
        }
      />
    );
    expect(screen.getByText('Centered')).toHaveAttribute(
      'style',
      'text-align: center;'
    );
    expect(screen.getByText('Overlay')).not.toHaveAttribute('style');
  });

  it('removes class attributes from the content', () => {
    render(
      <MinimalTipTapPreview
        content={'<p class="fixed inset-0 z-50">Overlay</p>'}
      />
    );
    expect(screen.getByText('Overlay')).not.toHaveAttribute('class');
  });

  it('renders nothing visible when the content is only unsafe markup', () => {
    const { container } = render(
      <MinimalTipTapPreview content={'<img src="x" onerror="alert(1)">'} />
    );
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
