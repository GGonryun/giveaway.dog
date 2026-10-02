import type { DndContextProps } from '@dnd-kit/core';
import type { SortableContextProps } from '@dnd-kit/sortable';
import { nanoid } from 'nanoid';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prize } from '@/schemas/giveaway/schemas';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
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

const renderPrizes = (prizes: Prize[], validate = false) =>
  renderWithForm(<Prizes />, {
    values: buildFormValues({ prizes }),
    validate
  });

describe('Prizes', () => {
  beforeEach(() => {
    dnd.context = null;
    dnd.items = [];
    vi.mocked(nanoid).mockReset().mockReturnValue('new-prize');
  });

  it('matches the snapshot', () => {
    const { container } = renderPrizes([giftCard, stickers]);
    expect(stabilizeIds(container)).toMatchSnapshot();
  });
});
