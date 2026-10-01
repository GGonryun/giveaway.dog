import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MinimalTipTapPreview } from '../minimal-tiptap-preview';

describe('MinimalTipTapPreview', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <MinimalTipTapPreview content="<p>Win a <strong>bike</strong></p>" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

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

  it('renders the markup without sanitising it', () => {
    const { container } = render(
      <MinimalTipTapPreview
        content={'<img src="x.png" alt="Prize" onerror="alert(1)">'}
      />
    );
    expect(container.querySelector('img')).toHaveAttribute(
      'onerror',
      'alert(1)'
    );
  });
});
