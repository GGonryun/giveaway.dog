'use client';

import {
  ChevronRight,
  MousePointerClickIcon,
  SettingsIcon,
  TicketIcon,
  UsersIcon
} from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@giveaway/ui-primitives/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from '@giveaway/ui-primitives/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useTeams } from '@giveaway/team-context/team-provider';
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
          icon: MousePointerClickIcon,
          items: [
            {
              name: 'X',
              url: `/app/${slug}/pickers/x`
            },
            {
              name: 'Discord',
              url: `/app/${slug}/pickers/discord`
            },
            {
              name: 'Twitch',
              url: `/app/${slug}/pickers/twitch`
            }
          ]
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
  const router = useRouter();
  const { state } = useSidebar();
  const data = useMemo(() => groups(activeTeam), [activeTeam]);

  return (
    <div>
      {data.map((g, i) => (
        <SidebarGroup key={i}>
          <SidebarGroupContent>
            {g.label && <SidebarGroupLabel>{g.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {g.items.map((item) => {
                const isActive =
                  item.url === path ||
                  (item.alias
                    ? item.alias.some((alias) => path.startsWith(alias))
                    : path.startsWith(item.url));

                if (item.items && item.items.length > 0) {
                  return (
                    <Collapsible
                      key={item.name}
                      asChild
                      defaultOpen={isActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.name}
                            onClick={(e) => {
                              if (state === 'collapsed') {
                                e.preventDefault();
                                router.push(item.url);
                              }
                            }}
                          >
                            <item.icon />
                            <span>{item.name}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.name}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={path === subItem.url}
                                >
                                  <Link href={subItem.url}>
                                    <span>{subItem.name}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  );
};
