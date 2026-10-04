'use client';

import { Button } from '@giveaway/ui-primitives/button';
import {
  PlusIcon,
  ChevronDown,
  FileText,
  Sparkles,
  FilePlus
} from 'lucide-react';
import { createSweepstakes } from '@giveaway/sweepstakes-editor-server/create-sweepstakes';
import { Spinner } from '@giveaway/ui-primitives/spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@giveaway/ui-primitives/dropdown-menu';
import { useProcedure } from '@giveaway/rpc-client/hook';
import { useTeams } from '@giveaway/team-context/team-provider';
import { useCreateSweepstakesPage } from '@giveaway/sweepstakes-routes/use-create-sweepstakes-page';
import { cn } from '@giveaway/ui-utils/utils';
import { useRouter } from 'next/navigation';
import { useCreateTemplate } from './templates/use-create-template';
import { timezone } from '@giveaway/util-time/time';

export const CreateGiveawayButton: React.FC<{
  text?: string;
  showIcon?: boolean;
  showDropdown?: boolean;
}> = ({ text = 'Create', showIcon = true, showDropdown = true }) => {
  const { activeTeam } = useTeams();
  const { navigateTo } = useCreateSweepstakesPage();
  const router = useRouter();

  const procedure = useProcedure({
    action: createSweepstakes,
    onSuccess: (data) => {
      navigateTo(data.id);
    }
  });

  const createTemplate = useCreateTemplate();

  const handleFromTemplate = () => {
    router.push(`/app/${activeTeam.slug}/templates`);
  };

  const handleCreateTemplate = () => {
    createTemplate.run();
  };

  const handleCreateSweepstakes = () => {
    procedure.run({ ...activeTeam, timezone: timezone.current() });
  };

  return (
    <div className="flex -mt-0.5 w-fit">
      <Button
        size="sm"
        className={cn(showDropdown ? 'rounded-r-none' : '')}
        disabled={procedure.isLoading}
        onClick={handleCreateSweepstakes}
      >
        {showIcon ? procedure.isLoading ? <Spinner /> : <PlusIcon /> : null}
        {procedure.isLoading ? 'Creating...' : text}
      </Button>

      {showDropdown && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="rounded-l-none border-l px-2"
              disabled={procedure.isLoading}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={handleCreateSweepstakes}
              disabled={procedure.isLoading}
            >
              <FileText />
              Start from scratch
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleFromTemplate}>
              <Sparkles />
              Use a template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateTemplate}>
              <FilePlus />
              Create a template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
