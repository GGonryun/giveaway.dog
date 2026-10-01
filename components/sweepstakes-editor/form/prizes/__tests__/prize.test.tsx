import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
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

const getIconButton = (icon: string) => {
  const button = document
    .querySelector(`button > svg.lucide-${icon}`)
    ?.closest('button');
  if (!button) throw new Error(`The ${icon} button was not found`);
  return button;
};

describe('Prize', () => {
  describe('when collapsed', () => {
    it('matches the snapshot', () => {
      const { container } = renderPrize();
      expect(stabilizeIds(container)).toMatchSnapshot();
    });

    it('numbers the prize from its index', () => {
      renderPrize({ index: 1 });
      expect(screen.getByText('Prize 2')).toBeInTheDocument();
    });

    it('hides the prize fields', () => {
      renderPrize();
      expect(screen.queryByLabelText('Prize name')).not.toBeInTheDocument();
      expect(getIconButton('chevron-down')).toBeInTheDocument();
    });

    it('asks to open when the expand button is clicked', async () => {
      const { onOpenChange } = renderPrize();
      await userEvent.click(getIconButton('chevron-down'));
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('asks to open when the header is clicked', async () => {
      const { onOpenChange } = renderPrize();
      await userEvent.click(screen.getByText('Prize 2'));
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe('actions', () => {
    it('removes the prize without toggling it', async () => {
      const { onRemove, onOpenChange } = renderPrize();
      await userEvent.click(getIconButton('trash-2'));
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('copies the prize without toggling it', async () => {
      const { onCopy, onOpenChange } = renderPrize();
      await userEvent.click(getIconButton('copy'));
      expect(onCopy).toHaveBeenCalledTimes(1);
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('when expanded', () => {
    it('matches the snapshot', () => {
      const { container } = renderPrize({ open: true });
      expect(stabilizeIds(container)).toMatchSnapshot();
    });

    it('asks to close when the collapse button is clicked', async () => {
      const { onOpenChange } = renderPrize({ open: true });
      await userEvent.click(getIconButton('chevron-up'));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('shows the fields of the prize at its index', () => {
      renderPrize({ index: 1, open: true });
      expect(screen.getByLabelText('Prize name')).toHaveValue('Sticker Pack');
      expect(screen.getByLabelText('Winners')).toHaveValue(3);
    });

    it('updates the name of the prize at its index', async () => {
      const { form } = renderPrize({ index: 1, open: true });
      const name = screen.getByLabelText('Prize name');
      await userEvent.clear(name);
      await userEvent.type(name, 'Poster');

      expect(form.getValues('prizes.1.name')).toBe('Poster');
      expect(form.getValues('prizes.0.name')).toBe('Gift Card');
    });

    it.each([
      ['5', 5],
      ['-2', 0],
      ['', 0]
    ])('stores %j winners as %s', (typed, stored) => {
      const { form } = renderPrize({ index: 1, open: true });
      fireEvent.change(screen.getByLabelText('Winners'), {
        target: { value: typed }
      });
      expect(form.getValues('prizes.1.quota')).toBe(stored);
    });
  });

  describe('validation', () => {
    it('requires a name of at least 3 characters', async () => {
      renderPrize({ open: true, validate: true });
      const name = screen.getByLabelText('Prize name');
      await userEvent.clear(name);
      await userEvent.type(name, 'ab');

      expect(
        await screen.findByText('String must contain at least 3 character(s)')
      ).toBeInTheDocument();
      expect(name).toHaveAttribute('aria-invalid', 'true');
    });

    it.each([
      ['0', 'Minimum value is 1'],
      ['11', 'Maximum value is 10']
    ])('rejects %s winners', async (typed, message) => {
      renderPrize({ open: true, validate: true });
      fireEvent.change(screen.getByLabelText('Winners'), {
        target: { value: typed }
      });

      expect(await screen.findByText(message)).toBeInTheDocument();
    });
  });
});
