'use client';

import { usePathname } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
          <NavigationMenuTrigger
            className={cn(pathname?.startsWith('/learn') && 'underline')}
          >
            Learn
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-70 gap-2 p-2">
              <li>
                <Link
                  href="/learn/integrations"
                  className={cn(
                    'block select-none space-y-1 rounded-sm p-2.5 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                    isActiveRoute('/learn/integrations') && 'bg-accent'
                  )}
                >
                  <div className="text-xs font-medium leading-none">
                    Integrations
                  </div>
                  <p className="line-clamp-2 text-xs leading-snug text-muted-foreground hover:text-accent-foreground mt-1">
                    Connect with your favorite platforms
                  </p>
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/templates"
                  className={cn(
                    'block select-none space-y-1 rounded-md p-2.5 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                    isActiveRoute('/learn/templates') && 'bg-accent'
                  )}
                >
                  <div className="text-xs font-medium leading-none">
                    Templates
                  </div>
                  <p
                    className="line-clamp-2 text-xs leading-snug text-muted-foreground
                  hover:text-accent-foreground mt-1"
                  >
                    Browse pre-made giveaway templates
                  </p>
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(pathname?.startsWith('/pickers') && 'underline')}
          >
            Tools
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-70 gap-2 p-2">
              <li>
                <Link
                  href="/pickers/x"
                  className={cn(
                    'block select-none space-y-1 rounded-sm p-2.5 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                    isActiveRoute('/pickers/x') && 'bg-accent'
                  )}
                >
                  <div className="text-xs font-medium leading-none">
                    X Picker
                  </div>
                  <p
                    className="line-clamp-2 text-xs leading-snug text-muted-foreground
                  hover:text-accent-foreground mt-1"
                  >
                    Pick a winner for your giveaway from a list of people
                  </p>
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
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
