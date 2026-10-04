'use client';

import { MenuIcon, UserIcon, Home, User, History, Gift } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@giveaway/ui-primitives/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from '@giveaway/ui-primitives/sheet';
import { Separator } from '@giveaway/ui-primitives/separator';
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from '@giveaway/ui-primitives/avatar';
import Link from 'next/link';
import { UserSchema } from '@/schemas/user';
import { NavigationHeader } from './navigation-header';
import { DesktopNavMenu } from './navigation/desktop-nav-menu';
import { MobileThemeToggle } from './navigation/mobile-theme-toggle';
import { MobileSheetHeader } from './navigation/mobile-sheet-header';
import { NavLogo } from './navigation/nav-logo';
import { UserDropdownMenu } from './navigation/user-dropdown-menu';
import { useLogout } from '@/lib/auth/hooks/use-logout';
import { cn } from '@giveaway/ui-utils/utils';

const UserAvatar: React.FC<{ user: UserSchema; className?: string }> = ({
  user,
  className
}) => {
  return (
    <Avatar
      className={cn(
        'h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
    >
      <AvatarImage
        src={
          user.image ?? `https://avatar.vercel.sh/${user?.email || user?.id}`
        }
        alt={user?.name || 'User avatar'}
      />
      <AvatarFallback className="border bg-background shadow-sm">
        <UserIcon />
      </AvatarFallback>
    </Avatar>
  );
};

export const LoggedInNavigationBar: React.FC<{ user: UserSchema }> = ({
  user
}) => {
  const isHost = useMemo(
    () => user.accountType === 'HOST',
    [user?.accountType]
  );
  const [open, setOpen] = useState(false);
  const logout = useLogout();

  const closeSheet = () => setOpen(false);

  return (
    <NavigationHeader>
      <NavLogo />
      <DesktopNavMenu />
      <div className="hidden items-center gap-2 lg:flex">
        <UserDropdownMenu user={user} />
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" size="icon">
            <MenuIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="top" className="max-h-screen overflow-auto gap-0">
          <MobileSheetHeader onLogoClick={closeSheet} />
          <div className="flex flex-col px-4 gap-3 mt-10">
            {isHost && (
              <Button asChild>
                <Link href="/pricing" onClick={closeSheet}>
                  Upgrade to Pro
                </Link>
              </Button>
            )}

            {isHost && (
              <Button variant="outline" asChild>
                <Link href="/app" onClick={closeSheet}>
                  Dashboard
                </Link>
              </Button>
            )}

            {!isHost && (
              <Button variant="outline" asChild>
                <Link href="/browse" onClick={closeSheet}>
                  Browse Giveaways
                </Link>
              </Button>
            )}

            <div className="flex flex-col gap-1 mt-4">
              <Link
                href="/account"
                onClick={closeSheet}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm">{user?.email}</span>
                <UserAvatar user={user} className="h-5 w-5" />
              </Link>

              <Link
                href="/account"
                onClick={closeSheet}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-muted-foreground">
                  Account Settings
                </span>
                <User className="h-4 w-4 text-muted-foreground" />
              </Link>

              {isHost && (
                <Link
                  href="/browse"
                  onClick={closeSheet}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-muted-foreground">
                    Browse Giveaways
                  </span>
                  <Gift className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}

              {!isHost && (
                <Link
                  href="/account/history"
                  onClick={closeSheet}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-muted-foreground">
                    Participation History
                  </span>
                  <History className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}

              <MobileThemeToggle textClassName="text-sm text-muted-foreground" />

              <button
                onClick={() => {
                  logout.run('/');
                  closeSheet();
                }}
                className="flex items-center justify-between py-2 cursor-pointer"
              >
                <span className="text-sm text-muted-foreground">Logout</span>
              </button>

              <Separator />

              <Link
                href="/browse"
                onClick={closeSheet}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm  text-muted-foreground">
                  Giveaways
                </span>
              </Link>

              <Link
                href="/learn/integrations"
                onClick={closeSheet}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-muted-foreground">
                  Integrations
                </span>
              </Link>

              <Link
                href="/learn/templates"
                onClick={closeSheet}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-muted-foreground">Templates</span>
              </Link>

              <Link
                href="/pickers/x"
                onClick={closeSheet}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-muted-foreground">X Picker</span>
              </Link>

              <Link
                href="/pricing"
                onClick={closeSheet}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm  text-muted-foreground">Pricing</span>
              </Link>

              <Link
                href="/contact"
                onClick={closeSheet}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-muted-foreground">Contact</span>
              </Link>

              <Link
                href="/home"
                onClick={closeSheet}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-muted-foreground">Home Page</span>
                <Home className="h-4 w-4 text-muted-foreground" />
              </Link>
              <div className="my-0.5" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </NavigationHeader>
  );
};
