import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorMessage } from '../use-form-issues';
import { FormIssuesDialog, FormIssuesDialogProps } from '../form-issues-dialog';
import {
  LayoutContextValue,
  renderWithLayout
} from '../../testing/layout-context';

const errors: ErrorMessage[] = [
  { path: 'title', message: 'Title is required' },
  { path: 'prizes.0.name', message: 'Prize name is required' }
];

describe('FormIssuesDialog', () => {
  const onOpenChange = vi.fn();
  const onJumpToField = vi.fn();

  const renderDialog = (
    props: Partial<FormIssuesDialogProps> = {},
    layout: Partial<LayoutContextValue> = {}
  ) =>
    renderWithLayout(
      <FormIssuesDialog
        open
        errors={errors}
        onOpenChange={onOpenChange}
        onJumpToField={onJumpToField}
        {...props}
      />,
      layout
    );

  beforeEach(() => {
    onOpenChange.mockReset();
    onJumpToField.mockReset();
  });

  it('renders nothing but the trigger while closed', () => {
    renderDialog({
      open: false,
      trigger: <button type="button">Show issues</button>
    });
    expect(
      screen.getByRole('button', { name: 'Show issues' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks to open when the trigger is clicked', async () => {
    renderDialog({
      open: false,
      trigger: <button type="button">Show issues</button>
    });
    await userEvent.click(screen.getByRole('button', { name: 'Show issues' }));
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('announces that there are problems', () => {
    renderDialog();
    expect(
      screen.getByRole('dialog', { name: 'There are some problems' })
    ).toBeInTheDocument();
  });

  it('explains how many issues block publishing a new form', () => {
    renderDialog();
    expect(
      screen.getByText('2 issues need to be fixed before you can publish')
    ).toBeInTheDocument();
  });

  it('explains how many issues block saving an existing form', () => {
    renderDialog({}, { action: 'edit' });
    expect(
      screen.getByText('2 issues need to be fixed before you can save changes')
    ).toBeInTheDocument();
  });

  it('uses the singular for a single issue', () => {
    renderDialog({ errors: errors.slice(0, 1) });
    expect(
      screen.getByText('1 issue need to be fixed before you can publish')
    ).toBeInTheDocument();
  });

  it('lists every issue with its field and message', () => {
    renderDialog();
    expect(
      screen.getByRole('button', { name: 'title Title is required' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'prizes.0.name Prize name is required'
      })
    ).toBeInTheDocument();
  });

  it('jumps to the field of the chosen issue', async () => {
    renderDialog();
    await userEvent.click(
      screen.getByRole('button', {
        name: 'prizes.0.name Prize name is required'
      })
    );
    expect(onJumpToField).toHaveBeenCalledExactlyOnceWith('prizes.0.name');
  });

  it('lists no issues when there are none', () => {
    renderDialog({ errors: [] });
    expect(
      screen.getByText('0 issues need to be fixed before you can publish')
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('renders the footer', () => {
    renderDialog({ footer: <button type="button">Keep editing</button> });
    expect(
      screen.getByRole('button', { name: 'Keep editing' })
    ).toBeInTheDocument();
  });

  it('asks to close when escape is pressed', async () => {
    renderDialog();
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('scrolls the issue list on mobile', () => {
    renderDialog({}, { mobile: true });
    expect(screen.getByRole('dialog')).toHaveClass(
      'overflow-y-auto',
      'max-h-80'
    );
  });

  it('uses a narrow dialog on desktop', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toHaveClass('max-w-md');
    expect(screen.getByRole('dialog')).not.toHaveClass('max-h-80');
  });
});
