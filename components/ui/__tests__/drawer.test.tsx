import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '../drawer';

function renderDrawer(
  props: {
    direction?: 'top' | 'right' | 'bottom' | 'left';
    onOpenChange?: (open: boolean) => void;
  } = {}
) {
  return render(
    <Drawer direction={props.direction} onOpenChange={props.onOpenChange}>
      <DrawerTrigger>Open entry</DrawerTrigger>
      <DrawerContent className="max-h-96">
        <DrawerHeader>
          <DrawerTitle>Entry details</DrawerTitle>
          <DrawerDescription>Submitted 2 days ago.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose>Dismiss</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

async function openDrawer() {
  await userEvent.click(screen.getByRole('button', { name: 'Open entry' }));
  return screen.getByRole('dialog', { name: 'Entry details' });
}

describe('Drawer', () => {
  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'setPointerCapture', {
      configurable: true,
      writable: true,
      value: vi.fn()
    });
  });

  afterAll(() => {
    Reflect.deleteProperty(Element.prototype, 'setPointerCapture');
  });

  it('opens from the trigger with its title and description', async () => {
    renderDrawer();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const drawer = await openDrawer();
    expect(drawer).toHaveAccessibleDescription('Submitted 2 days ago.');
    expect(drawer).toHaveAttribute('data-slot', 'drawer-content');
  });

  it('slides up from the bottom by default', async () => {
    renderDrawer();
    const drawer = await openDrawer();
    expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'bottom');
  });

  it('uses the requested direction', async () => {
    renderDrawer({ direction: 'right' });
    const drawer = await openDrawer();
    expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'right');
  });

  it('renders a drag handle, the header and footer slots and merges class names', async () => {
    renderDrawer();
    const drawer = await openDrawer();
    expect(drawer).toHaveClass('max-h-96', 'bg-background', 'fixed');
    expect(drawer.firstElementChild).toHaveClass('rounded-full', 'bg-muted');
    expect(drawer.querySelector('[data-slot="drawer-header"]')).toHaveClass(
      'p-4'
    );
    expect(drawer.querySelector('[data-slot="drawer-footer"]')).toHaveClass(
      'mt-auto'
    );
  });

  it('closes from a DrawerClose element', async () => {
    const onOpenChange = vi.fn();
    renderDrawer({ onOpenChange });
    const drawer = await openDrawer();

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => {
      expect(drawer).toHaveAttribute('data-state', 'closed');
    });
  });
});
