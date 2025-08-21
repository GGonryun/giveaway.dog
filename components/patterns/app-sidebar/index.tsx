'use client';

import * as React from 'react';
import { Home, SettingsIcon, TicketIcon, UsersIcon } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from '@/components/ui/sidebar';
import { NavProjects } from './nav-projects';
import { NavUser } from './nav-user';
import { TeamSwitcher } from './team-switcher';
import { useUser } from '@/components/context/user-provider';

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'player@giveaway.dog',
    avatar: '/avatars/shadcn.jpg'
  }
};

const groups = ({ slug }: { slug: string }) => {
  return [
    {
      items: [
        {
          name: 'Dashboard',
          url: `/app/${slug}`,
          icon: Home
        }
      ]
    },
    {
      items: [
        {
          name: 'Sweepstakes',
          url: `/app/${slug}/sweepstakes`,
          icon: TicketIcon
        },
        {
          name: 'Users',
          url: `/app/${slug}/users`,
          icon: UsersIcon
        },
        {
          name: 'Settings',
          url: `/app/${slug}/settings`,
          icon: SettingsIcon
        }
      ]
    }
  ];
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { activeTeam } = useUser();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects groups={groups(activeTeam)} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
