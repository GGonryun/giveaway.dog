'use client';

import {
  MousePointerClickIcon,
  SettingsIcon,
  TicketIcon,
  UsersIcon
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
import Link from 'next/link';

const groups = ({ slug }: { slug: string }) => {
  return [
    {
      label: undefined,
      items: [
        {
          name: 'Sweepstakes',
          url: `/app/${slug}`,
          alias: [`/app/${slug}/sweepstakes`, `/app/${slug}/templates`],
          icon: TicketIcon
        },
        {
          name: 'Pickers',
          url: `/app/${slug}/pickers`,
          alias: [],
          icon: MousePointerClickIcon
        },
        {
          name: 'Users',
          url: `/app/${slug}/users`,
          alias: [],
          icon: UsersIcon
        },
        {
          name: 'Settings',
          url: `/app/${slug}/settings`,
          alias: [],
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
                      (item.alias
                        ? item.alias.some((alias) => path.startsWith(alias))
                        : path.startsWith(item.url))
                    }
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
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
