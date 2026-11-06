import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { HelpDialog } from '../help-dialog';

const renderHelpDialog = (description?: string) =>
  render(
    <HelpDialog
      title="What is an entry method?"
      description={description}
      content={<p>An action participants complete to enter.</p>}
    />
  );

const helpTrigger = () =>
  screen.getByRole('button', { name: 'What is an entry method?' });

describe('HelpDialog', () => {
  it('renders a help button that opens a dialog', () => {
    renderHelpDialog('Entry methods explained');
    const trigger = helpTrigger();
    expect(trigger.tagName.toLowerCase()).toBe('button');
    expect(trigger).toHaveAttribute('type', 'button');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the title and content when the button is clicked', async () => {
    renderHelpDialog('Entry methods explained');
    await userEvent.click(helpTrigger());
    const dialog = screen.getByRole('dialog', {
      name: 'What is an entry method?'
    });
    expect(dialog).toHaveTextContent(
      'An action participants complete to enter.'
    );
  });

  it('describes the dialog with the description', async () => {
    renderHelpDialog('Entry methods explained');
    await userEvent.click(helpTrigger());
    expect(
      screen.getByRole('dialog', {
        name: 'What is an entry method?',
        description: 'Entry methods explained'
      })
    ).toBeInTheDocument();
  });

  it('renders no description when none is given', async () => {
    renderHelpDialog();
    await userEvent.click(helpTrigger());
    expect(
      screen.getByRole('dialog', { name: 'What is an entry method?' })
    ).not.toHaveAccessibleDescription('Entry methods explained');
    expect(
      screen.queryByText('Entry methods explained')
    ).not.toBeInTheDocument();
  });

  it('opens from the keyboard with Tab and Enter', async () => {
    const user = userEvent.setup();
    renderHelpDialog('Entry methods explained');
    await user.tab();
    expect(helpTrigger()).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('dialog', {
        name: 'What is an entry method?',
        description: 'Entry methods explained'
      })
    ).toBeInTheDocument();
  });

  it('opens from the keyboard with Tab and Space', async () => {
    const user = userEvent.setup();
    renderHelpDialog('Entry methods explained');
    await user.tab();
    expect(helpTrigger()).toHaveFocus();
    await user.keyboard(' ');
    expect(
      screen.getByRole('dialog', { name: 'What is an entry method?' })
    ).toBeInTheDocument();
  });

  it('closes from the close button', async () => {
    renderHelpDialog('Entry methods explained');
    await userEvent.click(helpTrigger());
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes with the escape key', async () => {
    renderHelpDialog('Entry methods explained');
    await userEvent.click(helpTrigger());
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
