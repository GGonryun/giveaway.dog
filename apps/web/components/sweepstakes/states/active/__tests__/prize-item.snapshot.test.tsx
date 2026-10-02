import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import {
  buildAllocations,
  buildPrize,
  withStableIds
} from '@/components/sweepstakes/__tests__/fixtures';
import { renderWithParticipation } from '@/components/sweepstakes/__tests__/participation-fixtures';
import { PrizeItem } from '../prize-item';

vi.mock('next/navigation', () => ({
  usePathname: () => '/browse/summer-giveaway',
  useSearchParams: () => new URLSearchParams()
}));

vi.mock('@/components/auth/login-options', () => ({
  LoginOptions: ({ label }: { label: string }) => (
    <div data-testid="login-options">{label}</div>
  )
}));

type PrizeItemProps = ComponentProps<typeof PrizeItem>;

const renderPrizeItem = (props: Partial<PrizeItemProps> = {}) =>
  renderWithParticipation(
    <PrizeItem
      prize={buildPrize()}
      isConnected
      open={false}
      state="unallocated"
      allocations={buildAllocations()}
      {...props}
    />
  );

describe('PrizeItem', () => {
  beforeEach(() => {
    vi.mocked(Element.prototype.scrollIntoView).mockClear();
  });

  describe('snapshots', () => {
    it('matches the snapshot when collapsed', () => {
      const { container } = renderPrizeItem();
      expect(withStableIds(container)).toMatchSnapshot();
    });

    it('matches the snapshot when expanded with popularity and an action', () => {
      const { container } = renderPrizeItem({
        open: true,
        onAllocate: vi.fn()
      });
      expect(withStableIds(container)).toMatchSnapshot();
    });
  });
});
