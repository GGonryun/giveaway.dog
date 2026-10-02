'use client';

import { MenuIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button';
import { NavigationHeader } from './navigation-header';
import { DesktopNavMenu } from './navigation/desktop-nav-menu';
import { MobileNavLinks } from './navigation/mobile-nav-links';
import { MobileThemeToggle } from './navigation/mobile-theme-toggle';
import { MobileSheetHeader } from './navigation/mobile-sheet-header';
import { NavLogo } from './navigation/nav-logo';

export const LoggedOutNavigationBar: React.FC = () => {
  const [open, setOpen] = useState(false);

  const closeSheet = () => setOpen(false);

  return (
    <NavigationHeader>
      <NavLogo />
      <DesktopNavMenu />
      <div className="hidden items-center gap-2 lg:flex">
        <ThemeToggleButton />
        <Button variant="outline" asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link href="/login">Get Started</Link>
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" size="icon">
            <MenuIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="top" className="max-h-screen overflow-auto">
          <MobileSheetHeader onLogoClick={closeSheet} />
          <div className="flex flex-col p-4 gap-6">
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/login" onClick={closeSheet}>
                  Get Started
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login" onClick={closeSheet}>
                  Login
                </Link>
              </Button>
            </div>

            <Separator />

            <MobileNavLinks onLinkClick={closeSheet} />

            <Separator />

            <MobileThemeToggle />
          </div>
        </SheetContent>
      </Sheet>
    </NavigationHeader>
  );
};
