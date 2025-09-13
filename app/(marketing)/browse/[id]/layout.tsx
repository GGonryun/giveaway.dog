'use server';

import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';

export default async function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-giveaway w-full h-full">
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 sm:gap-6 p-2 pb-4 sm:p-4 sm:pb-6 sm:container sm:max-w-2xl">
        <Button asChild className="w-full sm:w-fit self-start">
          <Link href="/browse">
            <ArrowLeftIcon />
            Browse More Giveaways
          </Link>
        </Button>

        {children}
      </div>
    </div>
  );
}
