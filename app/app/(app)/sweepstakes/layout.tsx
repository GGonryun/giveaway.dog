import { PlusIcon } from 'lucide-react';
import { Outline } from '../../outline';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Outline
      title="Sweepstakes"
      className="space-y-4"
      action={
        <Button asChild variant="secondary" size="sm" className="flex -mt-0.5">
          <Link href={'/app/host'}>
            <PlusIcon />
            Create
          </Link>
        </Button>
      }
    >
      {children}
    </Outline>
  );
}
