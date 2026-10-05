import { render, screen } from '@testing-library/react';
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
import { withStableIds } from '@giveaway/testing-dom/test-utils';

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
  it('matches the snapshot when open', async () => {
    renderDropdownMenu();
    const menu = await openMenu();
    expect(withStableIds(menu)).toMatchSnapshot();
  });
});
