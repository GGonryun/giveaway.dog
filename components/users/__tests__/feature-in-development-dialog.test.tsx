import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FeatureInDevelopmentDialog } from '../feature-in-development-dialog';

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

describe('FeatureInDevelopmentDialog', () => {
  it('matches the snapshot', () => {
    render(<FeatureInDevelopmentDialog open onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toMatchSnapshot();
  });

  describe('when open', () => {
    it('is titled as a feature in active development', () => {
      render(<FeatureInDevelopmentDialog open onClose={vi.fn()} />);

      expect(
        screen.getByRole('dialog', { name: 'Feature In Active Development' })
      ).toBeInTheDocument();
    });

    it('refers to the feature generically by default', () => {
      render(<FeatureInDevelopmentDialog open onClose={vi.fn()} />);

      expect(
        screen.getByText(
          'This feature is currently being actively developed and will be available soon.'
        )
      ).toBeInTheDocument();
    });

    it('names the feature when one is given', () => {
      render(
        <FeatureInDevelopmentDialog
          open
          onClose={vi.fn()}
          featureName="Bulk user export"
        />
      );

      expect(
        screen.getByText(
          'Bulk user export is currently being actively developed and will be available soon.'
        )
      ).toBeInTheDocument();
    });

    it('explains where to request early access', () => {
      render(<FeatureInDevelopmentDialog open onClose={vi.fn()} />);

      expect(screen.getByRole('dialog')).toHaveTextContent(
        'You can request early access from your Account > Feature Flags section'
      );
    });
  });

  describe('when dismissed', () => {
    it('calls onClose when Got it is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<FeatureInDevelopmentDialog open onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Got it' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape is pressed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<FeatureInDevelopmentDialog open onClose={onClose} />);

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('when closed', () => {
    it('renders nothing', () => {
      render(<FeatureInDevelopmentDialog open={false} onClose={vi.fn()} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
