import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StatusExplanationDialog } from '../status-explanation-dialog';

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

describe('StatusExplanationDialog', () => {
  describe('for an active user', () => {
    it('matches the snapshot', () => {
      render(
        <StatusExplanationDialog open onClose={vi.fn()} status="active" />
      );

      expect(screen.getByRole('alertdialog')).toMatchSnapshot();
    });

    it('explains that active users can win prizes', () => {
      render(
        <StatusExplanationDialog open onClose={vi.fn()} status="active" />
      );

      const dialog = screen.getByRole('alertdialog', {
        name: 'Active User Status'
      });
      expect(dialog).toHaveTextContent(
        'Active users are allowed to participate in any giveaway and are eligible to win prizes.'
      );
      expect(dialog).not.toHaveTextContent('shadow banned');
    });
  });

  describe('for a blocked user', () => {
    it('matches the snapshot', () => {
      render(
        <StatusExplanationDialog open onClose={vi.fn()} status="blocked" />
      );

      expect(screen.getByRole('alertdialog')).toMatchSnapshot();
    });

    it('explains that blocked users are shadow banned', () => {
      render(
        <StatusExplanationDialog open onClose={vi.fn()} status="blocked" />
      );

      const dialog = screen.getByRole('alertdialog', {
        name: 'Blocked User Status'
      });
      expect(dialog).toHaveTextContent('Blocked users are "shadow banned"');
      expect(dialog).toHaveTextContent(
        'Blocked users can only win if manually selected by giveaway administrators.'
      );
    });
  });

  describe('when dismissed', () => {
    it('calls onClose when Got it is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <StatusExplanationDialog open onClose={onClose} status="active" />
      );

      await user.click(screen.getByRole('button', { name: 'Got it' }));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('when closed', () => {
    it('renders nothing', () => {
      render(
        <StatusExplanationDialog
          open={false}
          onClose={vi.fn()}
          status="active"
        />
      );

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});
