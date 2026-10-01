import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

async function openFileMenu() {
  await userEvent.click(screen.getByRole('menuitem', { name: 'File' }));
  return screen.findByRole('menu');
}

describe('Menubar', () => {
  it('matches the snapshot when closed', () => {
    renderMenubar();
    expect(withStableIds(screen.getByRole('menubar'))).toMatchSnapshot();
  });

  it('renders a menubar with a trigger per menu', () => {
    renderMenubar();
    const menubar = screen.getByRole('menubar');
    expect(menubar).toHaveClass('w-full', 'rounded-md', 'border');
    expect(
      screen.getAllByRole('menuitem').map((trigger) => trigger.textContent)
    ).toEqual(['File', 'Edit']);
  });

  it('opens a menu from its trigger', async () => {
    renderMenubar();
    const menu = await openFileMenu();
    expect(menu).toHaveAttribute('data-slot', 'menubar-content');
    expect(screen.getByRole('menuitem', { name: 'File' })).toHaveAttribute(
      'data-state',
      'open'
    );
  });

  it('runs the item handler and closes when an item is chosen', async () => {
    const { onNew } = renderMenubar();
    await openFileMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'New⌘N' }));
    expect(onNew).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('marks destructive and inset items and labels', async () => {
    renderMenubar();
    await openFileMenu();
    const remove = screen.getByRole('menuitem', { name: 'Delete' });
    expect(remove).toHaveAttribute('data-variant', 'destructive');
    expect(remove).toHaveAttribute('data-inset', 'true');
    expect(screen.getByText('Document')).toHaveAttribute('data-inset', 'true');
  });

  it('reports checkbox and radio item changes', async () => {
    const { onAutosaveChange, onThemeChange } = renderMenubar();
    await openFileMenu();
    await userEvent.click(
      screen.getByRole('menuitemcheckbox', { name: 'Autosave' })
    );
    expect(onAutosaveChange).toHaveBeenCalledWith(true);

    await openFileMenu();
    expect(
      screen.getByRole('menuitemradio', { name: 'Light' })
    ).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Dark' }));
    expect(onThemeChange).toHaveBeenCalledWith('dark');
  });

  it('moves to the next menu with the arrow keys', async () => {
    renderMenubar();
    await openFileMenu();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: 'Undo' })
      ).toBeInTheDocument();
    });
  });

  it('opens a submenu with the keyboard', async () => {
    renderMenubar();
    await openFileMenu();
    screen.getByRole('menuitem', { name: 'Share' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: 'Email link' })
      ).toBeInTheDocument();
    });
  });
});
