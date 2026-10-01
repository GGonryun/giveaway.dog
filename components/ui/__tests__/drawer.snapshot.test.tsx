import { render, screen } from '@testing-library/react';
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
import { withStableIds } from './test-utils';

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

  it('matches the snapshot when open', async () => {
    renderDrawer();
    const drawer = await openDrawer();
    expect(withStableIds(drawer)).toMatchSnapshot();
  });
});
