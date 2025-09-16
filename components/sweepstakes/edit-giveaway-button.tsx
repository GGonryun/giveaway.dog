'use client';

import { Button } from '../ui/button';
import {
  PlusIcon,
  ChevronDown,
  FileText,
  Sparkles,
  EditIcon
} from 'lucide-react';
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

export const EditGiveawayButton: React.FC<{
  text?: string;
  variant?: 'default' | 'secondary';
  showIcon?: boolean;
}> = ({ text = 'Edit', showIcon = true, variant = 'secondary' }) => {
  const { activeTeam } = useTeams();
  const { navigateTo } = useCreateSweepstakesPage();

  const procedure = useProcedure({
    action: createSweepstakes,
    onSuccess: (data) => {
      navigateTo(data.id);
    }
  });

  return (
    <Button
      variant={variant}
      size="sm"
      disabled={procedure.isLoading}
      onClick={() => procedure.run(activeTeam)}
    >
      {showIcon ? procedure.isLoading ? <Spinner /> : <EditIcon /> : null}
      {procedure.isLoading ? 'Loading...' : text}
    </Button>
  );
};
