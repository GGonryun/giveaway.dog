'use client';

import { PlusIcon } from 'lucide-react';

import { useTeams } from '@/components/context/team-provider';
import { Button } from '@/components/ui/button';
import { usePickersPage } from '../hooks/use-pickers-page';

export const CreatePickerButton: React.FC<{
  text?: string;
  showIcon?: boolean;
}> = ({ text = 'Create', showIcon = true }) => {
  const { activeTeam } = useTeams();
  const { navigateTo } = usePickersPage();

  return (
    <div className="flex -mt-0.5 w-fit">
      <Button size="sm" onClick={() => navigateTo({ path: 'select-type' })}>
        {showIcon ? <PlusIcon /> : null}
        {text}
      </Button>
    </div>
  );
};
