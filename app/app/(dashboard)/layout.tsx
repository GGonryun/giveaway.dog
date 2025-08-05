import { PlusIcon } from 'lucide-react';
import { Outline } from '../outline';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Outline
      title="Dashboard"
      action={
        <Button asChild variant="secondary" size="sm" className="flex -mt-0.5">
          <Link href={'/app/host'}>
            <PlusIcon />
            New Giveaway
          </Link>
        </Button>
      }
    >
      {children}
    </Outline>
  );
}
