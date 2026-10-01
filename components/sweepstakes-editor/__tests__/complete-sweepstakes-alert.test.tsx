import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CompleteSweepstakesAlert } from '../complete-sweepstakes-alert';
import { stabilizeIds } from './stable-dom';

const renderAlert = (isCompleting = false) => {
  const onCompleteAction = vi.fn();
  const view = render(
    <CompleteSweepstakesAlert
      onCompleteAction={onCompleteAction}
      isCompleting={isCompleting}
    />
  );
  return { ...view, onCompleteAction };
};

describe('CompleteSweepstakesAlert', () => {
  describe('when the sweepstakes is not being completed', () => {
    it('matches the snapshot', () => {
      const { container } = renderAlert();
      expect(stabilizeIds(container)).toMatchSnapshot();
    });

    it('explains that all winners were selected', () => {
      renderAlert();
      expect(screen.getByRole('alert')).toHaveTextContent(
        'All Winners Selected'
      );
      expect(
        screen.getByRole('button', { name: 'Mark as Completed' })
      ).toBeEnabled();
    });

    it('asks for confirmation before completing', async () => {
      const { onCompleteAction } = renderAlert();
      await userEvent.click(
        screen.getByRole('button', { name: 'Mark as Completed' })
      );

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveTextContent('Are you absolutely sure?');
      expect(dialog).toHaveTextContent(
        'This action is irreversible and will permanently complete the sweepstakes.'
      );
      expect(onCompleteAction).not.toHaveBeenCalled();
    });

    it('matches the snapshot of the confirmation dialog', async () => {
      renderAlert();
      await userEvent.click(
        screen.getByRole('button', { name: 'Mark as Completed' })
      );
      expect(stabilizeIds(screen.getByRole('alertdialog'))).toMatchSnapshot();
    });

    it('completes the sweepstakes and closes the dialog when confirmed', async () => {
      const { onCompleteAction } = renderAlert();
      await userEvent.click(
        screen.getByRole('button', { name: 'Mark as Completed' })
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Yes, Complete Sweepstakes' })
      );

      expect(onCompleteAction).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      );
    });

    it('closes the dialog without completing when cancelled', async () => {
      const { onCompleteAction } = renderAlert();
      await userEvent.click(
        screen.getByRole('button', { name: 'Mark as Completed' })
      );
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() =>
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      );
      expect(onCompleteAction).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes is being completed', () => {
    it('matches the snapshot', () => {
      const { container } = renderAlert(true);
      expect(stabilizeIds(container)).toMatchSnapshot();
    });

    it('shows a disabled loading button', () => {
      renderAlert(true);
      expect(
        screen.getByRole('button', { name: 'Completing...' })
      ).toBeDisabled();
      expect(
        screen.queryByRole('button', { name: 'Mark as Completed' })
      ).not.toBeInTheDocument();
    });
  });
});
