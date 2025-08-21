'use client';

import { Button } from '../ui/button';
import { PlusIcon, ChevronDown, FileText, Sparkles } from 'lucide-react';
import { createSweepstakes } from '@/actions/app/create-sweepstakes';
import { Spinner } from '../ui/spinner';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { useProcedure } from '@/lib/mrpc/hook';
import { useUser } from '../context/user-provider';

export const CreateGiveawayButton: React.FC<{
  text?: string;
  variant?: 'default' | 'secondary';
  showIcon?: boolean;
  showDropdown?: boolean;
}> = ({
  text = 'Create',
  showIcon = true,
  showDropdown = true,
  variant = 'secondary'
}) => {
  const router = useRouter();
  const { activeTeam } = useUser();

  const procedure = useProcedure({
    action: createSweepstakes,
    onSuccess: (data) => {
      router.push(`/app/${activeTeam.slug}/create/${data.id}`);
    }
  });

  const handleFromTemplate = () => {
    router.push('/app/templates');
  };

  return (
    <div className="flex -mt-0.5 w-fit">
      <Button
        variant={variant}
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
              variant={variant}
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
              <FileText className="h-4 w-4 mr-2" />
              Start from scratch
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleFromTemplate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Use a template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
