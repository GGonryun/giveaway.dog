import { describe, expect, test } from 'vitest';
import { renderVisual, THEMES } from '@/test/visual/render';
import { MinimalTipTapPreview } from '../minimal-tiptap-preview';

const EDITOR_CONTENT = [
  '<h1>Summer giveaway</h1>',
  '<h2 style="text-align: center;">Win a mountain bike</h2>',
  '<h3>How to enter</h3>',
  '<p>Enter for a chance to win a <strong>mountain bike</strong>, <em>a helmet</em> and <u>gloves</u>. <s>No purchase</s> <code>NO PURCHASE</code> necessary.</p>',
  '<ul><li><p>One winner</p></li><li><p>Free shipping</p></li></ul>',
  '<ol><li><p>Follow us</p></li><li><p>Share the post</p></li></ol>',
  '<p style="text-align: right;">Read the <a target="_blank" rel="noopener noreferrer nofollow" href="https://giveaway.dog/rules">official rules</a>.<br>Good luck!</p>'
].join('');

const UNSAFE_CONTENT = [
  '<p style="position: fixed; inset: 0; background: red; z-index: 50">Win a prize</p>',
  '<p class="fixed inset-0 bg-destructive">Entries close on Friday.</p>',
  '<img src="missing.png" alt="Broken image" onerror="document.body.style.background = \'red\'">',
  '<iframe src="about:blank" width="400" height="200"></iframe>',
  '<style>[data-testid="visual-root"] { background: red !important; }</style>',
  '<p><a href="javascript:alert(1)">Rules</a></p>'
].join('');

describe.each(THEMES)('MinimalTipTapPreview (%s)', (theme) => {
  test('markup from the editor', async () => {
    const root = await renderVisual(
      <MinimalTipTapPreview content={EDITOR_CONTENT} />,
      { theme, width: 560 }
    );
    await expect.element(root).toMatchScreenshot();
  });

  test('sanitised unsafe markup', async () => {
    const root = await renderVisual(
      <MinimalTipTapPreview content={UNSAFE_CONTENT} />,
      { theme, width: 560 }
    );
    await expect.element(root).toMatchScreenshot();
  });
});
