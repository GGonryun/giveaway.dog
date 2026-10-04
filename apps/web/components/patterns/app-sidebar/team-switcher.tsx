'use client';

import * as React from 'react';
import { ChevronsUpDown, Plus } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@giveaway/ui-primitives/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@giveaway/ui-primitives/sidebar';
import { toast } from 'sonner';
import { DetailedUserTeam } from '@giveaway/team-model/teams';
import { useTeamsPage } from '@/components/team/use-teams-page';
import { useTeamPage } from '@/components/team/use-team-page';
import { useTeams } from '@/components/context/team-provider';
import { TeamLogo } from '@/components/team/team-logo';

export function TeamSwitcher() {
  const { activeTeam, teams } = useTeams();
  const { navigateToCreate } = useTeamsPage();
  const { navigateToTeam } = useTeamPage();
  const { isMobile } = useSidebar();

  const handleAddTeam = () => {
    navigateToCreate();
  };

  const handleSelectTeam = (team: DetailedUserTeam) => {
    if (team.slug !== activeTeam.slug) {
      navigateToTeam(team);
      toast.success(`Switched to team: ${team.name}`);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <TeamLogo
                logoUrl={activeTeam.logo}
                alt={`${activeTeam.name} logo`}
                size={32}
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => handleSelectTeam(team)}
                className="gap-2 p-2"
              >
                <TeamLogo
                  logoUrl={team.logo}
                  alt={`${team.name} logo`}
                  size={24}
                />
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2 [&_svg]:mr-0"
              onClick={handleAddTeam}
            >
              <div className="size-6 flex items-center justify-center rounded-md border bg-transparent">
                <Plus />
              </div>
              <div className="text-muted-foreground font-medium">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
