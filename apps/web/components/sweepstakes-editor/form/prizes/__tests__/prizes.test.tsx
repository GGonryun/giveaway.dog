import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  DndContextProps,
  DragEndEvent,
  DragStartEvent,
  UniqueIdentifier
} from '@dnd-kit/core';
import type { SortableContextProps } from '@dnd-kit/sortable';
import { nanoid } from 'nanoid';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prize } from '@giveaway/sweepstakes-model/schemas';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { Prizes } from '../prizes';

const dnd = vi.hoisted(() => ({
  context: null as DndContextProps | null,
  items: [] as SortableContextProps['items']
}));

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: (props: DndContextProps) => {
      dnd.context = props;
      return <actual.DndContext {...props} />;
    }
  };
});

vi.mock('@dnd-kit/sortable', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/sortable')>();
  return {
    ...actual,
    SortableContext: (props: SortableContextProps) => {
      dnd.items = props.items;
      return <actual.SortableContext {...props} />;
    }
  };
});

vi.mock('nanoid', () => ({ nanoid: vi.fn() }));

const giftCard: Prize = { id: 'prize-1', name: 'Gift Card', quota: 1 };
const stickers: Prize = { id: 'prize-2', name: 'Sticker Pack', quota: 3 };
const poster: Prize = { id: 'prize-3', name: 'Poster', quota: 2 };

const renderPrizes = (prizes: Prize[], validate = false) =>
  renderWithForm(<Prizes />, {
    values: buildFormValues({ prizes }),
    validate
  });

const sortableIds = () =>
  dnd.items.map((item) => (typeof item === 'object' ? item.id : item));

const active = (id: UniqueIdentifier): DragStartEvent['active'] => ({
  id,
  data: { current: undefined },
  rect: { current: { initial: null, translated: null } }
});

const dragEnd = (
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier | null
) => {
  const event: DragEndEvent = {
    active: active(activeId),
    over:
      overId === null
        ? null
        : {
            id: overId,
            disabled: false,
            data: { current: undefined },
            rect: {
              width: 0,
              height: 0,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }
          },
    activatorEvent: new Event('pointerdown'),
    collisions: null,
    delta: { x: 0, y: 0 }
  };
  act(() => {
    dnd.context?.onDragStart?.({
      active: event.active,
      activatorEvent: event.activatorEvent
    });
    dnd.context?.onDragEnd?.(event);
  });
};

const getCard = (label: string) => {
  const card = screen.getByText(label).closest('.group');
  if (!(card instanceof HTMLElement)) throw new Error(`${label} not found`);
  return card;
};

const clickIcon = async (label: string, icon: string) => {
  const button = getCard(label)
    .querySelector(`button > svg.lucide-${icon}`)
    ?.closest('button');
  if (!button) throw new Error(`The ${icon} button was not found`);
  await userEvent.click(button);
};

describe('Prizes', () => {
  beforeEach(() => {
    dnd.context = null;
    dnd.items = [];
    vi.mocked(nanoid).mockReset().mockReturnValue('new-prize');
  });

  it('shows a numbered card for each prize', () => {
    renderPrizes([giftCard, stickers, poster]);
    expect(screen.getByRole('heading', { name: 'Prizes' })).toBeInTheDocument();
    expect(screen.getByText('Prize 1')).toBeInTheDocument();
    expect(screen.getByText('Prize 2')).toBeInTheDocument();
    expect(screen.getByText('Prize 3')).toBeInTheDocument();
  });

  describe('adding prizes', () => {
    it('adds a default prize at the end', async () => {
      const { form } = renderPrizes([giftCard]);
      await userEvent.click(
        screen.getByRole('button', { name: 'Add New Prize' })
      );

      expect(form.getValues('prizes')).toEqual([
        giftCard,
        { id: 'new-prize', name: 'My Custom Prize', quota: 1 }
      ]);
      expect(screen.getByText('Prize 2')).toBeInTheDocument();
    });

    it('adds a copy of a prize with a new id at the end', async () => {
      const { form } = renderPrizes([giftCard, stickers]);
      await clickIcon('Prize 1', 'copy');

      expect(form.getValues('prizes')).toEqual([
        giftCard,
        stickers,
        { ...giftCard, id: 'new-prize' }
      ]);
    });
  });

  describe('removing prizes', () => {
    it('removes the clicked prize', async () => {
      const { form } = renderPrizes([giftCard, stickers, poster]);
      await clickIcon('Prize 2', 'trash-2');

      expect(form.getValues('prizes')).toEqual([giftCard, poster]);
      expect(screen.queryByText('Prize 3')).not.toBeInTheDocument();
    });

    it('requires at least one prize', async () => {
      renderPrizes([giftCard], true);
      await clickIcon('Prize 1', 'trash-2');

      expect(
        await screen.findByText('At least one prize is required')
      ).toBeInTheDocument();
    });
  });

  describe('reordering prizes', () => {
    it('moves a dragged prize to the position it was dropped on', () => {
      const { form } = renderPrizes([giftCard, stickers, poster]);
      const [first, , third] = sortableIds();
      dragEnd(first, third);

      expect(form.getValues('prizes')).toEqual([stickers, poster, giftCard]);
    });

    it('keeps the order when a prize is dropped outside the list', () => {
      const { form } = renderPrizes([giftCard, stickers]);
      const [first] = sortableIds();
      dragEnd(first, null);

      expect(form.getValues('prizes')).toEqual([giftCard, stickers]);
    });

    it('keeps the order when a prize is dropped on itself', () => {
      const { form } = renderPrizes([giftCard, stickers]);
      const [first] = sortableIds();
      dragEnd(first, first);

      expect(form.getValues('prizes')).toEqual([giftCard, stickers]);
    });
  });

  describe('expanding prizes', () => {
    it('shows the fields of an expanded prize', async () => {
      renderPrizes([giftCard, stickers]);
      await clickIcon('Prize 2', 'chevron-down');

      expect(screen.getByLabelText('Prize name')).toHaveValue('Sticker Pack');
      expect(screen.getByLabelText('Winners')).toHaveValue(3);
    });

    it('hides the fields when the prize is collapsed again', async () => {
      renderPrizes([giftCard]);
      await clickIcon('Prize 1', 'chevron-down');
      await clickIcon('Prize 1', 'chevron-up');

      expect(screen.queryByLabelText('Prize name')).not.toBeInTheDocument();
    });

    it.fails(
      'keeps the other prizes expanded when one prize is collapsed',
      async () => {
        renderPrizes([giftCard, stickers]);
        await clickIcon('Prize 1', 'chevron-down');
        await clickIcon('Prize 2', 'chevron-down');
        await clickIcon('Prize 1', 'chevron-up');

        expect(screen.getByLabelText('Prize name')).toHaveValue('Sticker Pack');
      }
    );
  });
});
