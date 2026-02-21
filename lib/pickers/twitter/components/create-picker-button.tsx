'use client';

import { PlusIcon } from 'lucide-react';

import { useTeams } from '@/components/context/team-provider';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useProcedure } from '@/lib/mrpc/hook';
import { createPicker } from '../procedures/create-picker';

export const CreatePickerButton: React.FC<{
  text?: string;
  showIcon?: boolean;
}> = ({ text = 'Create', showIcon = true }) => {
  const { activeTeam } = useTeams();
  const router = useRouter();

  const createProcedure = useProcedure({
    action: createPicker,
    onSuccess: (data) => {
      router.push(`/app/${activeTeam.slug}/pickers/twitter/${data.id}/create`);
    }
  });

  return (
    <div className="flex -mt-0.5 w-fit">
      <Button
        size="sm"
        onClick={() => createProcedure.run({ slug: activeTeam.slug })}
        disabled={createProcedure.isLoading}
      >
        {showIcon ? <PlusIcon /> : null}
        {createProcedure.isLoading ? 'Creating...' : text}
      </Button>
    </div>
  );
};
