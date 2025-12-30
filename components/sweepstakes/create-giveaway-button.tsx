'use client';

import { Button } from '../ui/button';
import { PlusIcon, ChevronDown, FileText, Sparkles, FilePlus } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useCreateTemplate } from '../templates/use-create-template';

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

  return (
    <div className="flex -mt-0.5 w-fit">
      <Button
        size="sm"
        className={cn(showDropdown ? 'rounded-r-none' : '')}
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
