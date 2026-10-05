import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ErrorMessage } from '../use-form-issues';
import { UnifiedFormFooter } from '../unified-form-footer';
import {
  LayoutContextValue,
  renderWithLayout
} from '../../testing/layout-context';

const formErrors: ErrorMessage[] = [
  { path: 'title', message: 'Title is required' },
  { path: 'tasks', message: 'Add at least one task' }
];

const renderFooter = (overrides: Partial<LayoutContextValue> = {}) =>
  renderWithLayout(<UnifiedFormFooter />, overrides);

const issuesDialog = () =>
  within(screen.getByRole('dialog', { name: 'There are some problems' }));

describe('UnifiedFormFooter', () => {
  describe('issues button', () => {
    it('is hidden while the form is valid', () => {
      renderFooter();
      expect(
        screen.queryByRole('button', { name: /Issue/ })
      ).not.toBeInTheDocument();
    });

    it.each([
      [1, '1 Issue'],
      [2, '2 Issues']
    ])('counts %i issue(s)', (count, label) => {
      renderFooter({ formErrors: formErrors.slice(0, count) });
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });

    it('asks to show the issues when clicked', async () => {
      const { context } = renderFooter({ formErrors });
      await userEvent.click(screen.getByRole('button', { name: '2 Issues' }));
      expect(context.setShowIssues).toHaveBeenCalledExactlyOnceWith(true);
    });
  });

  describe('issues dialog', () => {
    it('lists the issues and jumps to the chosen field', async () => {
      const { context } = renderFooter({ formErrors, showIssues: true });
      await userEvent.click(
        issuesDialog().getByRole('button', {
          name: 'tasks Add at least one task'
        })
      );
      expect(context.onJumpToField).toHaveBeenCalledExactlyOnceWith('tasks');
    });

    it('closes when the user continues editing', async () => {
      const { context } = renderFooter({ formErrors, showIssues: true });
      await userEvent.click(
        issuesDialog().getByRole('button', { name: 'Continue Editing' })
      );
      expect(context.setShowIssues).toHaveBeenCalledWith(false);
    });

    it('offers to save and exit while creating', async () => {
      const { context } = renderFooter({ formErrors, showIssues: true });
      await userEvent.click(
        issuesDialog().getByRole('button', { name: 'Save & Exit' })
      );
      expect(context.onSave).toHaveBeenCalledTimes(1);
    });

    it('does not offer to save and exit while editing', () => {
      renderFooter({ formErrors, showIssues: true, action: 'edit' });
      expect(
        issuesDialog().queryByRole('button', { name: 'Save & Exit' })
      ).not.toBeInTheDocument();
    });

    it('disables its actions while the form is disabled', () => {
      renderFooter({ formErrors, showIssues: true, disabled: true });
      expect(
        issuesDialog().getByRole('button', { name: 'Continue Editing' })
      ).toBeDisabled();
      expect(
        issuesDialog().getByRole('button', { name: 'Save & Exit' })
      ).toBeDisabled();
    });
  });

  describe('step navigation', () => {
    it('disables Back on the first step', () => {
      renderFooter({ currentStep: 'details' });
      expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    });

    it('goes back to the previous step', async () => {
      const { context } = renderFooter({ currentStep: 'prizes' });
      await userEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(context.setCurrentStep).toHaveBeenCalledExactlyOnceWith('details');
    });

    it('moves to the next step without submitting', async () => {
      const { context } = renderFooter({ currentStep: 'details' });
      const next = screen.getByRole('button', { name: 'Next' });
      expect(next).toHaveAttribute('type', 'button');
      await userEvent.click(next);
      expect(context.setCurrentStep).toHaveBeenCalledExactlyOnceWith('prizes');
    });

    it('lets the user continue to the next step even with issues', () => {
      renderFooter({ currentStep: 'details', formErrors });
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    });
  });

  describe('on the last step', () => {
    it('submits with Publish while creating', () => {
      renderFooter({ currentStep: 'tasks', action: 'create' });
      expect(screen.getByRole('button', { name: 'Publish' })).toHaveAttribute(
        'type',
        'submit'
      );
      expect(
        screen.queryByRole('button', { name: 'Next' })
      ).not.toBeInTheDocument();
    });

    it('submits with Save while editing', () => {
      renderFooter({ currentStep: 'tasks', action: 'edit' });
      expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute(
        'type',
        'submit'
      );
    });

    it('emphasises the submit button only when the form is valid', () => {
      const { rerenderWithLayout } = renderFooter({ currentStep: 'tasks' });
      expect(screen.getByRole('button', { name: 'Publish' })).toHaveClass(
        'bg-primary'
      );
      rerenderWithLayout({ currentStep: 'tasks', formErrors });
      expect(screen.getByRole('button', { name: 'Publish' })).toHaveClass(
        'border'
      );
      expect(screen.getByRole('button', { name: 'Publish' })).not.toHaveClass(
        'bg-primary'
      );
    });
  });
});
