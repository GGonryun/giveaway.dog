import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '../dropdown-menu';

function renderDropdownMenu() {
  const onProfile = vi.fn();
  const onStatusBarChange = vi.fn();
  const onPositionChange = vi.fn();
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>Account</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel inset>My account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onProfile}>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem inset>Billing</DropdownMenuItem>
          <DropdownMenuItem disabled>Team</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          checked={false}
          onCheckedChange={onStatusBarChange}
        >
          Status bar
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value="top" onValueChange={onPositionChange}>
          <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Email</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return { onProfile, onStatusBarChange, onPositionChange };
}

async function openMenu() {
  await userEvent.click(screen.getByRole('button', { name: 'Account' }));
  return screen.findByRole('menu');
}

describe('DropdownMenu', () => {
  it('opens the menu from the trigger', async () => {
    renderDropdownMenu();
    const trigger = screen.getByRole('button', { name: 'Account' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await openMenu();

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent)
    ).toEqual(['Profile⇧⌘P', 'Billing', 'Team', 'Invite users']);
  });

  it('runs the item handler and closes when an item is chosen', async () => {
    const { onProfile } = renderDropdownMenu();
    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Profile⇧⌘P' }));
    expect(onProfile).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('indents inset items and labels', async () => {
    renderDropdownMenu();
    await openMenu();
    expect(screen.getByText('My account')).toHaveClass('pl-8', 'font-semibold');
    expect(screen.getByRole('menuitem', { name: 'Billing' })).toHaveClass(
      'pl-8'
    );
    expect(screen.getByRole('menuitem', { name: 'Team' })).not.toHaveClass(
      'pl-8'
    );
  });

  it('disables items', async () => {
    renderDropdownMenu();
    await openMenu();
    expect(screen.getByRole('menuitem', { name: 'Team' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('reports checkbox item changes', async () => {
    const { onStatusBarChange } = renderDropdownMenu();
    await openMenu();
    const item = screen.getByRole('menuitemcheckbox', { name: 'Status bar' });
    expect(item).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(item);
    expect(onStatusBarChange).toHaveBeenCalledWith(true);
  });

  it('reports radio item changes and marks the selected one', async () => {
    const { onPositionChange } = renderDropdownMenu();
    await openMenu();
    const top = screen.getByRole('menuitemradio', { name: 'Top' });
    expect(top).toHaveAttribute('aria-checked', 'true');
    expect(top.querySelector('svg')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('menuitemradio', { name: 'Bottom' })
    );
    expect(onPositionChange).toHaveBeenCalledWith('bottom');
  });

  it('opens a submenu with the keyboard', async () => {
    renderDropdownMenu();
    await openMenu();
    screen.getByRole('menuitem', { name: 'Invite users' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: 'Email' })
      ).toBeInTheDocument();
    });
  });

  it('closes when Escape is pressed', async () => {
    renderDropdownMenu();
    await openMenu();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
