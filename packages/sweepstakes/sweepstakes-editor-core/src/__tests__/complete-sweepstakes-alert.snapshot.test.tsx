import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CompleteSweepstakesAlert } from '../complete-sweepstakes-alert';
import { stabilizeIds } from '@giveaway/testing-dom/stable-dom';

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

    it('matches the snapshot of the confirmation dialog', async () => {
      renderAlert();
      await userEvent.click(
        screen.getByRole('button', { name: 'Mark as Completed' })
      );
      expect(stabilizeIds(screen.getByRole('alertdialog'))).toMatchSnapshot();
    });
  });

  describe('when the sweepstakes is being completed', () => {
    it('matches the snapshot', () => {
      const { container } = renderAlert(true);
      expect(stabilizeIds(container)).toMatchSnapshot();
    });
  });
});
