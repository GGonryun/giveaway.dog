import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { HelpDialog } from '../help-dialog';

const renderHelpDialog = () =>
  render(
    <HelpDialog
      title="What is an entry method?"
      description="Entry methods explained"
      content={<p>An action participants complete to enter.</p>}
    />
  );

const helpTrigger = (container: HTMLElement) =>
  container.querySelector('[aria-haspopup="dialog"]') as Element;

describe('HelpDialog', () => {
  it('renders a help icon that opens a dialog', () => {
    const { container } = renderHelpDialog();
    const trigger = helpTrigger(container);
    expect(trigger.tagName.toLowerCase()).toBe('svg');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the title and content when the icon is clicked', async () => {
    const { container } = renderHelpDialog();
    await userEvent.click(helpTrigger(container));
    const dialog = screen.getByRole('dialog', {
      name: 'What is an entry method?'
    });
    expect(dialog).toHaveTextContent(
      'An action participants complete to enter.'
    );
  });

  it('does not render the description', async () => {
    const { container } = renderHelpDialog();
    await userEvent.click(helpTrigger(container));
    expect(
      screen.queryByText('Entry methods explained')
    ).not.toBeInTheDocument();
  });

  it('closes from the close button', async () => {
    const { container } = renderHelpDialog();
    await userEvent.click(helpTrigger(container));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes with the escape key', async () => {
    const { container } = renderHelpDialog();
    await userEvent.click(helpTrigger(container));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
