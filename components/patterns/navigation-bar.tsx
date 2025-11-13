'use client';

import {
  MenuIcon,
  ChevronRight,
  MousePointerClickIcon,
  SparklesIcon,
  UsersIcon
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { EmojiLogo } from './emoji-logo';
import Link from 'next/link';
import { UserSchema } from '@/schemas/user';
import { HOST_DASHBOARD_FEATURE_FLAG_KEY } from '@/schemas/feature-flags';
import { featureFlags } from '@/lib/feature-flags';
import { cn } from '@/lib/utils';

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
    if (path === '/tools') {
      return pathname?.startsWith('/tools');
    }
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
                <NavigationMenuTrigger
                  onClick={(e) => {
                    const isOpen =
                      e.currentTarget.getAttribute('data-state') === 'open';
                    if (isOpen) {
                      e.preventDefault();
                    }
                  }}
                  className={cn(isActiveRoute('/tools') && 'underline')}
                >
                  Tools
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[400px] p-4">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2 px-3">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                          Premium Tools
                        </h4>
                      </div>
                      <ul className="space-y-1">
                        <li>
                          <Link
                            href="/tools/sweepstakes"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center gap-2">
                              <SparklesIcon className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">
                                Sweepstakes Platform
                              </div>
                              <Badge className="text-[10px] px-1 py-0">
                                Beta
                              </Badge>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1">
                              Professional sweepstakes with fraud detection
                            </p>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/tools/pickers/social"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center gap-2">
                              <MousePointerClickIcon className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">
                                Social Pickers
                              </div>
                              <Badge className="text-[10px] px-1 py-0">
                                Beta
                              </Badge>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1">
                              Randomly pick winners from social media posts
                            </p>
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <Separator className="my-3" />
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-3">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                          Free Tools
                        </h4>
                      </div>
                      <ul className="space-y-1">
                        <li>
                          <Link
                            href="/tools/pickers/names"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center gap-2">
                              <UsersIcon className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">
                                Name Picker
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1">
                              Spin the wheel to pick a random name
                            </p>
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <Separator className="my-3" />
                    <Link
                      href="/tools"
                      className="flex items-center justify-between text-sm font-medium hover:text-primary transition-colors px-3"
                    >
                      View all tools
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
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
                  href="/support"
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActiveRoute('/support') && 'underline'
                  )}
                >
                  Support
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
            </NavigationMenuList>
          </NavigationMenu>
          <div className="hidden items-center gap-2 lg:flex">
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
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-muted-foreground">
                        TOOLS
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 pl-3">
                      <Link
                        href="/tools/sweepstakes"
                        className="flex items-center gap-2 text-sm"
                        onClick={closeSheet}
                      >
                        <SparklesIcon className="h-4 w-4 text-primary" />
                        <span>Sweepstakes Platform</span>
                      </Link>
                      <Link
                        href="/tools/pickers/social"
                        className="flex items-center gap-2 text-sm"
                        onClick={closeSheet}
                      >
                        <MousePointerClickIcon className="h-4 w-4 text-primary" />
                        <span>Social Pickers</span>
                      </Link>
                      <Link
                        href="/tools/pickers/names"
                        className="flex items-center gap-2 text-sm"
                        onClick={closeSheet}
                      >
                        <UsersIcon className="h-4 w-4 text-primary" />
                        <span>Name Picker</span>
                        <Badge
                          variant="success"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Free
                        </Badge>
                      </Link>
                      <Link
                        href="/tools"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={closeSheet}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span>View all tools</span>
                      </Link>
                    </div>
                  </div>
                  <Separator />

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
                    href="/support"
                    className={cn(
                      'font-medium',
                      isActiveRoute('/support') && 'text-primary'
                    )}
                    onClick={closeSheet}
                  >
                    Support
                  </Link>
                  <Link
                    href="/pricing"
                    className={cn(
                      'font-medium',
                      isActiveRoute('/pricing') && 'text-primary'
                    )}
                    onClick={closeSheet}
                  >
                    Pricing
                  </Link>
                </div>
                <div className="mt-6 flex flex-col gap-2">
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
