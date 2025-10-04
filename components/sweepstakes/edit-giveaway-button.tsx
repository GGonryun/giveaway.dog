'use client';

import { Button } from '../ui/button';
import { EditIcon } from 'lucide-react';
import { useEditSweepstakesPage } from './use-edit-sweepstakes-page';
import Link from 'next/link';

export const EditGiveawayButton: React.FC<{
  id: string;
}> = ({ id }) => {
  const { route } = useEditSweepstakesPage();

  return (
    <Button variant="secondary" size="sm" asChild>
      <Link href={route(id)} passHref>
        <EditIcon />
        Edit
      </Link>
    </Button>
  );
};
