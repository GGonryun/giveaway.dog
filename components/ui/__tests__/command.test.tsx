import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from '../command';
import { withStableIds } from './test-utils';

function renderCommand(onSelect = vi.fn()) {
  const result = render(
    <Command>
      <CommandInput placeholder="Search giveaways..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Giveaways">
          <CommandItem onSelect={onSelect}>Summer bike</CommandItem>
          <CommandItem>
            Winter jacket
            <CommandShortcut>⌘J</CommandShortcut>
          </CommandItem>
          <CommandItem disabled onSelect={onSelect}>
            Archived prize
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>Billing</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
  return { ...result, onSelect };
}

function getOptionLabels() {
  return screen.getAllByRole('option').map((option) => option.textContent);
}

describe('Command', () => {
  it('matches the snapshot', () => {
    const { container } = renderCommand();
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it('lists every item before searching', () => {
    renderCommand();
    expect(getOptionLabels()).toEqual([
      'Summer bike',
      'Winter jacket⌘J',
      'Archived prize',
      'Billing'
    ]);
    expect(screen.queryByText('No results.')).not.toBeInTheDocument();
  });

  it('filters the items as the user types', async () => {
    renderCommand();
    await userEvent.type(screen.getByRole('combobox'), 'bike');
    expect(getOptionLabels()).toEqual(['Summer bike']);
  });

  it('shows the empty message when nothing matches', async () => {
    renderCommand();
    await userEvent.type(screen.getByRole('combobox'), 'zzz');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('No results.')).toHaveAttribute(
      'data-slot',
      'command-empty'
    );
  });

  it('selects an item when it is clicked', async () => {
    const { onSelect } = renderCommand();
    await userEvent.click(screen.getByRole('option', { name: 'Summer bike' }));
    expect(onSelect).toHaveBeenCalledWith('Summer bike');
  });

  it('selects the highlighted item with Enter', async () => {
    const { onSelect } = renderCommand();
    await userEvent.type(screen.getByRole('combobox'), 'summer{enter}');
    expect(onSelect).toHaveBeenCalledWith('Summer bike');
  });

  it('does not select a disabled item', async () => {
    const { onSelect } = renderCommand();
    const archived = screen.getByRole('option', { name: 'Archived prize' });
    expect(archived).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(archived);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders group headings and the search icon', () => {
    const { container } = renderCommand();
    expect(screen.getByText('Giveaways')).toHaveAttribute('cmdk-group-heading');
    expect(
      container.querySelector('[data-slot="command-input-wrapper"] svg')
    ).toBeInTheDocument();
    expect(screen.getByText('⌘J')).toHaveAttribute(
      'data-slot',
      'command-shortcut'
    );
  });
});

describe('CommandDialog', () => {
  it('renders the command palette inside a labelled dialog when open', () => {
    render(
      <CommandDialog open>
        <CommandInput placeholder="Type a command" />
        <CommandList>
          <CommandItem>Profile</CommandItem>
        </CommandList>
      </CommandDialog>
    );
    const dialog = screen.getByRole('dialog', { name: 'Command Palette' });
    expect(dialog).toHaveAccessibleDescription(
      'Search for a command to run...'
    );
    expect(dialog).toContainElement(screen.getByRole('combobox'));
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('uses a custom title and description and can hide the close button', () => {
    render(
      <CommandDialog
        open
        title="Jump to"
        description="Find a giveaway"
        showCloseButton={false}
      >
        <CommandInput />
      </CommandDialog>
    );
    expect(
      screen.getByRole('dialog', { name: 'Jump to' })
    ).toHaveAccessibleDescription('Find a giveaway');
    expect(
      screen.queryByRole('button', { name: 'Close' })
    ).not.toBeInTheDocument();
  });

  it('keeps its screen reader title in the page while closed', () => {
    render(
      <CommandDialog>
        <CommandInput />
      </CommandDialog>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Command Palette')).toBeInTheDocument();
    expect(screen.getByText('Command Palette').parentElement).toHaveClass(
      'sr-only'
    );
  });
});
