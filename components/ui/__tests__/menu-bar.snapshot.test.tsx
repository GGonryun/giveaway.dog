import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger
} from '../menu-bar';
import { withStableIds } from './test-utils';

function renderMenubar() {
  const onNew = vi.fn();
  const onAutosaveChange = vi.fn();
  const onThemeChange = vi.fn();
  render(
    <Menubar className="w-full">
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarLabel inset>Document</MenubarLabel>
          <MenubarGroup>
            <MenubarItem onSelect={onNew}>
              New
              <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem variant="destructive" inset>
              Delete
            </MenubarItem>
          </MenubarGroup>
          <MenubarSeparator />
          <MenubarCheckboxItem
            checked={false}
            onCheckedChange={onAutosaveChange}
          >
            Autosave
          </MenubarCheckboxItem>
          <MenubarRadioGroup value="light" onValueChange={onThemeChange}>
            <MenubarRadioItem value="light">Light</MenubarRadioItem>
            <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
          </MenubarRadioGroup>
          <MenubarSub>
            <MenubarSubTrigger>Share</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Email link</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Undo</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
  return { onNew, onAutosaveChange, onThemeChange };
}

describe('Menubar', () => {
  it('matches the snapshot when closed', () => {
    renderMenubar();
    expect(withStableIds(screen.getByRole('menubar'))).toMatchSnapshot();
  });
});
