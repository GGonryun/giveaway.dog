'use client';

import { MenuIcon } from 'lucide-react';
import { useMemo } from 'react';

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
import { EmojiLogo } from './logo-button';
import Link from 'next/link';
import { User } from 'next-auth';

export const NavigationBar: React.FC<{ user?: User }> = ({ user }) => {
  const isLoggedIn = useMemo(() => !!user?.id, [user?.id]);

  return (
    <section className="py-4">
      <div className="container">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <EmojiLogo className="text-3xl mb-1" />
            <span className="text-lg font-semibold tracking-tighter">
              Giveaway.dog
            </span>
          </Link>
          <NavigationMenu className="hidden lg:block">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/support"
                  className={navigationMenuTriggerStyle()}
                >
                  Support
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/browse"
                  className={navigationMenuTriggerStyle()}
                >
                  Browse Giveaways
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/pricing"
                  className={navigationMenuTriggerStyle()}
                >
                  Pricing
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <div className="hidden items-center gap-4 lg:flex">
            {!isLoggedIn ? (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Start Now</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/user">Account</Link>
                </Button>
                <Button asChild>
                  <Link href="/app">Dashboard</Link>
                </Button>
              </>
            )}
          </div>
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="icon">
                <MenuIcon className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="max-h-screen overflow-auto">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" className="flex items-center gap-2">
                    <EmojiLogo className="text-3xl mb-1" />
                    <span className="text-lg font-semibold tracking-tighter">
                      Giveaway.dog
                    </span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col p-4">
                <div className="flex flex-col gap-6">
                  <Link href="/support" className="font-medium">
                    Support
                  </Link>
                  <Link href="/browse" className="font-medium">
                    Browse Giveaways
                  </Link>
                  <Link href="/pricing" className="font-medium">
                    Pricing
                  </Link>
                </div>
                <div className="mt-6 flex flex-col gap-4">
                  {!isLoggedIn ? (
                    <>
                      <Button variant="outline" asChild>
                        <Link href="/login">Login</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/signup">Start Now</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild>
                        <Link href="/user">Account</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/app">Dashboard</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </section>
  );
};
