'use client';

import { PlusIcon, ChevronDown, FileText, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useTeams } from '@/components/context/team-provider';
import { createPicker } from '../procedures/create-picker';
import { useProcedure } from '@/lib/mrpc/hook';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { usePickersPage } from '../hooks/use-pickers-page';

export const CreatePickerButton: React.FC<{
  text?: string;
  showIcon?: boolean;
  showDropdown?: boolean;
}> = ({ text = 'Create', showIcon = true, showDropdown = true }) => {
  const { activeTeam } = useTeams();
  const { navigateTo } = usePickersPage();

  const procedure = useProcedure({
    action: createPicker,
    onSuccess: (data) => {
      navigateTo({
        path: 'create',
        id: data.id
      });
    }
  });

  const handleFromTemplate = () => {
    alert('TODO: support templates');
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
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
