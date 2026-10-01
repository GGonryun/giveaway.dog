import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '../navigation-menu';

function renderNavigationMenu(onClick = vi.fn()) {
  const result = render(
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger onClick={onClick}>
            Product
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="https://example.com/features">
              Features
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            href="https://example.com/pricing"
            className={navigationMenuTriggerStyle()}
          >
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuIndicator />
      </NavigationMenuList>
    </NavigationMenu>
  );
  return { ...result, onClick };
}

function getTrigger() {
  return screen.getByRole('button', { name: 'Product' });
}

describe('NavigationMenu', () => {
  it('renders a navigation landmark with its links', () => {
    renderNavigationMenu();
    expect(screen.getByRole('navigation')).toHaveClass('relative', 'z-10');
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute(
      'href',
      'https://example.com/pricing'
    );
    expect(
      screen.queryByRole('link', { name: 'Features' })
    ).not.toBeInTheDocument();
  });

  it('opens the content when the trigger is clicked', () => {
    const { onClick } = renderNavigationMenu();
    fireEvent.click(getTrigger());
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Features' })).toBeInTheDocument();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps the menu open when the open trigger is clicked again', () => {
    const { onClick } = renderNavigationMenu();
    fireEvent.click(getTrigger());
    fireEvent.click(getTrigger());
    expect(getTrigger()).toHaveAttribute('data-state', 'open');
    expect(screen.getByRole('link', { name: 'Features' })).toBeInTheDocument();
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('closes the menu when Escape is pressed', async () => {
    renderNavigationMenu();
    fireEvent.click(getTrigger());
    screen.getByRole('link', { name: 'Features' }).focus();
    await userEvent.keyboard('{Escape}');
    expect(getTrigger()).toHaveAttribute('data-state', 'closed');
  });

  it('renders the content inside the viewport', () => {
    const { container } = renderNavigationMenu();
    fireEvent.click(getTrigger());
    const viewport = container.querySelector('.origin-top-center');
    expect(viewport).toHaveAttribute('data-state', 'open');
    expect(viewport).toContainElement(
      screen.getByRole('link', { name: 'Features' })
    );
    expect(viewport?.parentElement).toHaveClass('absolute', 'top-full');
  });

  it('renders a chevron next to the trigger label', () => {
    renderNavigationMenu();
    const chevron = getTrigger().querySelector('svg');
    expect(chevron).toHaveAttribute('aria-hidden', 'true');
    expect(chevron).toHaveClass('group-data-[state=open]:rotate-180');
  });
});

describe('navigationMenuTriggerStyle', () => {
  it('returns the trigger classes', () => {
    const classes = navigationMenuTriggerStyle();
    expect(classes).toContain('inline-flex');
    expect(classes).toContain('h-10');
    expect(classes).toContain('rounded-md');
  });
});
