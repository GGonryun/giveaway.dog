import { describe, expect, it } from 'vitest';
import { renderWithForm } from '@giveaway/sweepstakes-editor-setup/testing/form-harness';
import { stabilizeIds } from '@giveaway/testing-dom/stable-dom';
import { Selection } from '../selection';

describe('Selection', () => {
  it('matches the snapshot', () => {
    const { container } = renderWithForm(<Selection />);
    expect(stabilizeIds(container)).toMatchSnapshot();
  });
});
