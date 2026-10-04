import { describe, expect, it, vi } from 'vitest';
import {
  buildFormValues,
  renderWithForm
} from '@giveaway/sweepstakes-editor-setup/testing/form-harness';
import { stabilizeIds } from '@giveaway/testing-dom/stable-dom';
import { Prize } from '../prize';

const values = buildFormValues({
  prizes: [
    { id: 'prize-1', name: 'Gift Card', quota: 1 },
    { id: 'prize-2', name: 'Sticker Pack', quota: 3 }
  ]
});

const renderPrize = ({
  index = 1,
  open = false,
  validate = false
}: { index?: number; open?: boolean; validate?: boolean } = {}) => {
  const handlers = {
    onRemove: vi.fn(),
    onCopy: vi.fn(),
    onOpenChange: vi.fn()
  };
  const view = renderWithForm(
    <Prize id="field-1" index={index} open={open} {...handlers} />,
    { values, validate }
  );
  return { ...view, ...handlers };
};

describe('Prize', () => {
  describe('when collapsed', () => {
    it('matches the snapshot', () => {
      const { container } = renderPrize();
      expect(stabilizeIds(container)).toMatchSnapshot();
    });
  });

  describe('when expanded', () => {
    it('matches the snapshot', () => {
      const { container } = renderPrize({ open: true });
      expect(stabilizeIds(container)).toMatchSnapshot();
    });
  });
});
