import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  GiveawayHeaderSkeleton,
  PrizeListSkeleton,
  TaskListSkeleton
} from '../giveaway-skeleton';

describe('giveaway skeletons', () => {
  describe('GiveawayHeaderSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<GiveawayHeaderSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('TaskListSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<TaskListSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('PrizeListSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<PrizeListSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
