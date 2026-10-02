import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MinimalTipTapPreview } from '../minimal-tiptap-preview';

const EDITOR_CONTENT = [
  '<h2 style="text-align: center;">Win a bike</h2>',
  '<p>Enter for a chance to win a <strong>mountain bike</strong>, <em>a helmet</em> and <u>gloves</u>.</p>',
  '<ul><li><p>One winner</p></li><li><p>Free shipping</p></li></ul>',
  '<ol start="2"><li><p>Follow us</p></li><li><p>Share the post</p></li></ol>',
  '<p>Read the <a target="_blank" rel="noopener noreferrer nofollow" href="https://giveaway.dog/rules">rules</a>.<br>Good <s>luck</s> <code>fun</code>!</p>'
].join('');

const UNSAFE_CONTENT = [
  '<p onclick="alert(1)" class="fixed inset-0" style="position: fixed">Prize</p>',
  '<img src="x.png" alt="Prize" onerror="alert(1)">',
  '<script>alert(1)</script>',
  '<iframe src="https://evil.example"></iframe>',
  '<style>body { display: none; }</style>',
  '<a href="javascript:alert(1)">Rules</a>'
].join('');

describe('MinimalTipTapPreview', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <MinimalTipTapPreview content="<p>Win a <strong>bike</strong></p>" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches the snapshot for the markup the editor produces', () => {
    const { container } = render(
      <MinimalTipTapPreview content={EDITOR_CONTENT} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches the snapshot for sanitised unsafe markup', () => {
    const { container } = render(
      <MinimalTipTapPreview content={UNSAFE_CONTENT} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
