'use client';

import { Button } from '@giveaway/ui-primitives/button';
import { EditIcon } from 'lucide-react';
import { useEditSweepstakesPage } from '@giveaway/sweepstakes-routes/use-edit-sweepstakes-page';
import Link from 'next/link';

export const EditGiveawayButton: React.FC<{
  id: string;
}> = ({ id }) => {
  const { route } = useEditSweepstakesPage();

  return (
    <Button size="sm" asChild>
      <Link href={route(id)} passHref>
        <EditIcon />
        Edit
      </Link>
    </Button>
  );
};
