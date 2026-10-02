import { fireEvent, render, screen } from '@testing-library/react';
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
});
