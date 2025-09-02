'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const BackButton = () => {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="self-start mb-4 hover:bg-gray-100"
    >
      <Link href="/browse">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Browse all sweepstakes
      </Link>
    </Button>
  );
};