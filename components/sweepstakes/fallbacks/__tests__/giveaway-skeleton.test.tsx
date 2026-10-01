import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  GiveawayHeaderSkeleton,
  GiveawayParticipationSkeleton,
  PrizeListSkeleton,
  TaskListSkeleton
} from '../giveaway-skeleton';

const skeletons = (container: HTMLElement) =>
  container.querySelectorAll('[data-slot="skeleton"]');

describe('giveaway skeletons', () => {
  describe('GiveawayHeaderSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<GiveawayHeaderSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('labels the banner and badge as a preview', () => {
      render(<GiveawayHeaderSkeleton />);
      expect(screen.getByText('Preview Banner')).toBeInTheDocument();
      expect(screen.getByText('Preview Mode')).toBeInTheDocument();
    });

    it('renders placeholders for the title, host, stats and description', () => {
      const { container } = render(<GiveawayHeaderSkeleton />);
      expect(skeletons(container)).toHaveLength(8);
    });
  });

  describe('TaskListSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<TaskListSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders three placeholder task rows', () => {
      const { container } = render(<TaskListSkeleton />);
      expect(container.querySelectorAll('.border.rounded-lg')).toHaveLength(3);
    });
  });

  describe('PrizeListSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<PrizeListSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders two placeholder prize rows', () => {
      const { container } = render(<PrizeListSkeleton />);
      expect(container.querySelectorAll('.border.rounded-lg')).toHaveLength(2);
    });
  });

  describe('GiveawayParticipationSkeleton', () => {
    it('stacks the header, task and prize skeletons', () => {
      const { container } = render(<GiveawayParticipationSkeleton />);
      const sections = container.firstElementChild?.children ?? [];
      expect(sections).toHaveLength(3);
      expect(screen.getByText('Preview Mode')).toBeInTheDocument();
      expect(skeletons(container)).toHaveLength(8 + 3 + 3 * 4 + 1 + 2 * 2);
    });
  });
});
