import { render } from '@testing-library/react';
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
import { withStableIds } from '@giveaway/testing-dom/test-utils';

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

describe('NavigationMenu', () => {
  it('matches the snapshot when closed', () => {
    const { container } = renderNavigationMenu();
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });
});
