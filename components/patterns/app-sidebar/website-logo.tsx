'use client';

import * as React from 'react';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { EmojiLogo } from '../logo-button';
import Link from 'next/link';
import { HomeIcon, PanelLeftIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WebsiteLogo() {
  const { open, toggleSidebar } = useSidebar();
  return (
    <SidebarMenu>
      <div className={cn('flex  justify-between items-center w-full gap-2')}>
        {open && (
          <SidebarMenuItem className="flex-grow">
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <EmojiLogo className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-base" />
                <div className="grid flex-1 text-left text-base leading-tight">
                  <span className="truncate font-semibold">Giveaway.Dog</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        <SidebarMenuItem>
          <SidebarTrigger />
        </SidebarMenuItem>
      </div>
      {!open && (
        <SidebarMenuButton className="flex items-center justify-center p-2 size-8 bg-sidebar-primary rounded-lg">
          <Link href="/">
            <EmojiLogo className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-base" />
          </Link>
        </SidebarMenuButton>
      )}
    </SidebarMenu>
  );
}
