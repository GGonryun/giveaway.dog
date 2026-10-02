import { describe, expect, it } from 'vitest';
import { renderWithForm } from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
import { Selection } from '../selection';

describe('Selection', () => {
  it('matches the snapshot', () => {
    const { container } = renderWithForm(<Selection />);
    expect(stabilizeIds(container)).toMatchSnapshot();
  });
});
