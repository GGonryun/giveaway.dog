import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MinimalTipTapPreview } from '../minimal-tiptap-preview';

describe('MinimalTipTapPreview', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <MinimalTipTapPreview content="<p>Win a <strong>bike</strong></p>" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
