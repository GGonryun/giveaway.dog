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
import { useMemo } from 'react';
import { useTeams } from '@/components/context/team-provider';

const groups = ({ slug }: { slug: string }) => {
  return [
    {
      label: undefined,
      items: [
        {
          name: 'Sweepstakes',
          url: `/app/${slug}`,
          alias: `/app/${slug}/sweepstakes`,
          icon: TicketIcon
        },
        {
          name: 'Users',
          url: `/app/${slug}/users`,
          alias: undefined,
          icon: UsersIcon
        },
        {
          name: 'Settings',
          url: `/app/${slug}/settings`,
          alias: undefined,
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
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === path ||
                      (item.alias ? path.startsWith(item.alias) : false)
                    }
                  >
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
