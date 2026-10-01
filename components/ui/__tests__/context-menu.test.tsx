import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger
} from '../context-menu';
import { withStableIds } from './test-utils';

function renderContextMenu() {
  const onEdit = vi.fn();
  const onShowGridChange = vi.fn();
  const onLayoutChange = vi.fn();
  render(
    <ContextMenu>
      <ContextMenuTrigger>Right click here</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel inset>Actions</ContextMenuLabel>
        <ContextMenuGroup>
          <ContextMenuItem onSelect={onEdit}>
            Edit
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
          <ContextMenuItem disabled>Archive</ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem
          checked={false}
          onCheckedChange={onShowGridChange}
        >
          Show grid
        </ContextMenuCheckboxItem>
        <ContextMenuRadioGroup value="list" onValueChange={onLayoutChange}>
          <ContextMenuRadioItem value="list">List</ContextMenuRadioItem>
          <ContextMenuRadioItem value="grid">Grid</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
        <ContextMenuSub>
          <ContextMenuSubTrigger inset>Share</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Copy link</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
  return { onEdit, onShowGridChange, onLayoutChange };
}

function openMenu() {
  fireEvent.contextMenu(screen.getByText('Right click here'));
  return screen.getByRole('menu');
}

describe('ContextMenu', () => {
  it('matches the snapshot when open', () => {
    renderContextMenu();
    expect(withStableIds(openMenu())).toMatchSnapshot();
  });

  it('opens the menu on right click', () => {
    renderContextMenu();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    const menu = openMenu();
    expect(menu).toHaveAttribute('data-slot', 'context-menu-content');
    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent)
    ).toEqual(['Edit⌘E', 'Delete', 'Archive', 'Share']);
  });

  it('runs the item handler and closes when an item is chosen', async () => {
    const { onEdit } = renderContextMenu();
    openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit⌘E' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('marks destructive, inset and disabled items', () => {
    renderContextMenu();
    openMenu();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
      'data-variant',
      'destructive'
    );
    expect(screen.getByText('Actions')).toHaveAttribute('data-inset', 'true');
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('reports checkbox and radio item changes', async () => {
    const { onShowGridChange, onLayoutChange } = renderContextMenu();
    openMenu();
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Show grid' })
    ).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('menuitemradio', { name: 'List' })).toHaveAttribute(
      'aria-checked',
      'true'
    );

    await userEvent.click(
      screen.getByRole('menuitemcheckbox', { name: 'Show grid' })
    );
    expect(onShowGridChange).toHaveBeenCalledWith(true);

    openMenu();
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Grid' }));
    expect(onLayoutChange).toHaveBeenCalledWith('grid');
  });

  it('opens a submenu with the keyboard', async () => {
    renderContextMenu();
    openMenu();
    screen.getByRole('menuitem', { name: 'Share' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: 'Copy link' })
      ).toBeInTheDocument();
    });
  });

  it('renders the shortcut with muted styling', () => {
    renderContextMenu();
    openMenu();
    expect(screen.getByText('⌘E')).toHaveClass(
      'ml-auto',
      'text-muted-foreground'
    );
  });

  it('closes when Escape is pressed', async () => {
    renderContextMenu();
    openMenu();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
