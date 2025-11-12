'use client';

import { PlusIcon, ChevronDown, FileText, Sparkles } from 'lucide-react';

import { useTeams } from '@/components/context/team-provider';
import { createPicker } from '../procedures/create-picker';
import { useProcedure } from '@/lib/mrpc/hook';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { usePickersPage } from '../hooks/use-pickers-page';
import { useRouter } from 'next/navigation';

export const CreatePickerButton: React.FC<{
  text?: string;
  showIcon?: boolean;
}> = ({ text = 'Create', showIcon = true }) => {
  const { activeTeam } = useTeams();
  const { navigateTo } = usePickersPage();
  const router = useRouter();

  const procedure = useProcedure({
    action: createPicker,
    onSuccess: (data) => {
      navigateTo({
        path: 'create',
        id: data.id
      });
    }
  });

  return (
    <div className="flex -mt-0.5 w-fit">
      <Button
        size="sm"
        disabled={procedure.isLoading}
        onClick={() => procedure.run(activeTeam)}
      >
        {showIcon ? procedure.isLoading ? <Spinner /> : <PlusIcon /> : null}
        {procedure.isLoading ? 'Creating...' : text}
      </Button>
    </div>
  );
};
