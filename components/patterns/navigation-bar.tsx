'use client';

import { MenuIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

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
import { UserType } from '@prisma/client';

export const NavigationBar: React.FC<{ user: UserSchema | null }> = ({
  user
}) => {
  const isLoggedIn = useMemo(() => !!user?.id, [user?.id]);
  const isHost = useMemo(
    () => isLoggedIn && user?.type.includes(UserType.HOST),
    [isLoggedIn, user?.type]
  );
  const [open, setOpen] = useState(false);

  const closeSheet = () => setOpen(false);

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
                    href="/support"
                    className="font-medium"
                    onClick={closeSheet}
                  >
                    Support
                  </Link>
                  <Link
                    href="/browse"
                    className="font-medium"
                    onClick={closeSheet}
                  >
                    Browse Giveaways
                  </Link>
                  <Link
                    href="/pricing"
                    className="font-medium"
                    onClick={closeSheet}
                  >
                    Pricing
                  </Link>
                </div>
                <div className="mt-6 flex flex-col gap-4">
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
    </section>
  );
};
