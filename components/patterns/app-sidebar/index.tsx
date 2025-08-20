'use client';

import * as React from 'react';
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Home,
  SettingsIcon,
  TicketIcon,
  UsersIcon
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from '@/components/ui/sidebar';
import { NavProjects } from './nav-projects';
import { NavUser } from './nav-user';
import { WebsiteLogo } from './website-logo';
import { TeamSwitcher } from './team-switcher';

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'player@giveaway.dog',
    avatar: '/avatars/shadcn.jpg'
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise'
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup'
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free'
    }
  ],
  groups: [
    {
      items: [
        {
          name: 'Dashboard',
          url: '/app',
          icon: Home
        }
      ]
    },
    {
      items: [
        {
          name: 'Sweepstakes',
          url: '/app/sweepstakes',
          icon: TicketIcon
        },
        {
          name: 'Users',
          url: '/app/users',
          icon: UsersIcon
        },
        {
          name: 'Settings',
          url: '/app/settings',
          icon: SettingsIcon
        }
      ]
    }
  ]
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects groups={data.groups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
