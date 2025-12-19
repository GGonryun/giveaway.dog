'use client';

import { usePathname } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

export const DesktopNavMenu: React.FC = () => {
  const pathname = usePathname();

  const isActiveRoute = (path: string) => {
    return pathname === path;
  };

  return (
    <NavigationMenu className="hidden lg:block absolute left-1/2 -translate-x-1/2">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink
            href="/browse"
            className={cn(
              navigationMenuTriggerStyle(),
              isActiveRoute('/browse') && 'underline'
            )}
          >
            Giveaways
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            href="/pricing"
            className={cn(
              navigationMenuTriggerStyle(),
              isActiveRoute('/pricing') && 'underline'
            )}
          >
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            href="/contact"
            className={cn(
              navigationMenuTriggerStyle(),
              isActiveRoute('/contact') && 'underline'
            )}
          >
            Contact
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
