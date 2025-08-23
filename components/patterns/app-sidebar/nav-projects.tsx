'use client';

import {
  Home,
  SettingsIcon,
  TicketIcon,
  UsersIcon,
  type LucideIcon
} from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useUser } from '@/components/context/user-provider';
import { useMemo } from 'react';
import { useTeams } from '@/components/context/team-provider';

const groups = ({ slug }: { slug: string }) => {
  return [
    {
      label: undefined,
      items: [
        {
          name: 'Dashboard',
          url: `/app/${slug}`,
          icon: Home
        }
      ]
    },
    {
      label: undefined,
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

export const NavGroups = () => {
  const { activeTeam } = useTeams();
  const path = usePathname();
  const data = useMemo(() => groups(activeTeam), [activeTeam]);
  return (
    <div>
      {data.map((g, i) => (
        <SidebarGroup key={i}>
          <SidebarGroupContent>
            {g.label && <SidebarGroupLabel>{g.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {g.items.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={path === item.url}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  );
};
