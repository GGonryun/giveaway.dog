'use client';

import { Button } from '../ui/button';
import { PlusIcon, ChevronDown, FileText, Sparkles } from 'lucide-react';
import { createSweepstakes } from '@/procedures/sweepstakes/create-sweepstakes';
import { Spinner } from '../ui/spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { useProcedure } from '@/lib/mrpc/hook';
import { useTeams } from '../context/team-provider';
import { useCreateSweepstakesPage } from './use-create-sweepstakes-page';

export const CreateGiveawayButton: React.FC<{
  text?: string;
  showIcon?: boolean;
  showDropdown?: boolean;
}> = ({ text = 'Create', showIcon = true, showDropdown = true }) => {
  const { activeTeam } = useTeams();
  const { navigateTo } = useCreateSweepstakesPage();

  const procedure = useProcedure({
    action: createSweepstakes,
    onSuccess: (data) => {
      navigateTo(data.id);
    }
  });

  const handleFromTemplate = () => {
    alert('TODO: support templates');
  };

  return (
    <div className="flex -mt-0.5 w-fit">
      <Button
        size="sm"
        className="rounded-r-none"
        disabled={procedure.isLoading}
        onClick={() => procedure.run(activeTeam)}
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
              onClick={() => procedure.run(activeTeam)}
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
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
