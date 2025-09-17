'use client';

import { Button } from '../ui/button';
import { EditIcon } from 'lucide-react';
import { useTeams } from '../context/team-provider';
import { useEditSweepstakesPage } from './use-edit-sweepstakes-page';
import Link from 'next/link';

export const EditGiveawayButton: React.FC<{
  sweepstakesId: string;
}> = ({ sweepstakesId }) => {
  const { activeTeam } = useTeams();
  const { route } = useEditSweepstakesPage();

  return (
    <Button variant="secondary" size="sm" asChild>
      <Link href={route(sweepstakesId)} passHref>
        <EditIcon />
        Edit
      </Link>
    </Button>
  );
};
