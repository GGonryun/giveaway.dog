'use client';

import { PlusIcon } from 'lucide-react';

import { useTeams } from '@/components/context/team-provider';
import { Button } from '@giveaway/ui-primitives/button';
import { useRouter } from 'next/navigation';
import { useProcedure } from '@/lib/mrpc/hook';
import { createTwitterPicker } from '../procedures/create-twitter-v2-picker';

export const CreatePickerV2Button: React.FC<{
  text?: string;
  showIcon?: boolean;
}> = ({ text = 'Create', showIcon = true }) => {
  const { activeTeam } = useTeams();
  const router = useRouter();

  const createProcedure = useProcedure({
    action: createTwitterPicker,
    onSuccess: (data) => {
      router.push(`/app/${activeTeam.slug}/pickers/x/${data.id}/create`);
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
