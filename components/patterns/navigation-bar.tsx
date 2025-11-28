'use client';

import { MenuIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { EmojiLogo } from './emoji-logo';
import Link from 'next/link';
import { UserSchema } from '@/schemas/user';
import { HOST_DASHBOARD_FEATURE_FLAG_KEY } from '@/schemas/feature-flags';
import { featureFlags } from '@/lib/feature-flags';
import { cn } from '@/lib/utils';
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button';

export const NavigationBar: React.FC<{ user: UserSchema | null }> = ({
  user
}) => {
  const isLoggedIn = useMemo(() => !!user?.id, [user?.id]);
  const isHost = useMemo(
    () =>
      isLoggedIn &&
      featureFlags.parseUser(user, HOST_DASHBOARD_FEATURE_FLAG_KEY),
    [isLoggedIn, user?.featureFlags]
  );
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const closeSheet = () => setOpen(false);

  const isActiveRoute = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <EmojiLogo className="text-3xl mb-1" />
            <span className="text-lg font-semibold">Giveaway.dog</span>
          </Link>
          <NavigationMenu className="hidden lg:block">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/browse"
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActiveRoute('/browse') && 'underline'
                  )}
                >
                  Browse Giveaways
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/#pricing"
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
          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggleButton />
            {!isLoggedIn ? (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/login">Get Started</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/account">Account</Link>
                </Button>
                {isHost ? (
                  <Button asChild>
                    <Link href="/app">Dashboard</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/browse">Giveaways</Link>
                  </Button>
                )}
              </>
            )}
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="icon">
                <MenuIcon className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="max-h-screen overflow-auto">
              <SheetHeader>
                <SheetTitle>
                  <Link
                    href="/"
                    className="flex items-center gap-2"
                    onClick={closeSheet}
                  >
                    <EmojiLogo className="text-3xl mb-1" />
                    <span className="text-lg font-semibold tracking-tighter">
                      Giveaway.dog
                    </span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col p-4">
                <div className="flex flex-col gap-6">
                  <Link
                    href="/browse"
                    className={cn(
                      'font-medium',
                      isActiveRoute('/browse') && 'text-primary'
                    )}
                    onClick={closeSheet}
                  >
                    Browse Giveaways
                  </Link>
                  <Link
                    href="/#pricing"
                    className={cn(
                      'font-medium',
                      isActiveRoute('/pricing') && 'text-primary'
                    )}
                    onClick={closeSheet}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/contact"
                    className={cn(
                      'font-medium',
                      isActiveRoute('/contact') && 'text-primary'
                    )}
                    onClick={closeSheet}
                  >
                    Contact
                  </Link>
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium">Theme</span>
                    <ThemeToggleButton />
                  </div>
                  {!isLoggedIn ? (
                    <>
                      <Button variant="outline" asChild>
                        <Link href="/login" onClick={closeSheet}>
                          Login
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link href="/login" onClick={closeSheet}>
                          Get Started
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild>
                        <Link href="/account" onClick={closeSheet}>
                          Account
                        </Link>
                      </Button>
                      {isHost ? (
                        <Button asChild>
                          <Link href="/app" onClick={closeSheet}>
                            Dashboard
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild>
                          <Link href="/browse" onClick={closeSheet}>
                            Giveaways
                          </Link>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
};
