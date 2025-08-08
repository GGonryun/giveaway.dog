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
import { cn } from '@/lib/utils';

export function WebsiteLogo() {
  const { isMobile } = useSidebar();
  return (
    <SidebarMenu>
      <div className={cn('flex  justify-between items-center w-full gap-2')}>
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
        {isMobile && (
          <SidebarMenuItem>
            <SidebarTrigger />
          </SidebarMenuItem>
        )}
      </div>
    </SidebarMenu>
  );
}
