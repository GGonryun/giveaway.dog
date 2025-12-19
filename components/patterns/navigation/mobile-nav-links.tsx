'use client';

import { ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const MobileNavLinks: React.FC<{ onLinkClick: () => void }> = ({
  onLinkClick
}) => {
  const pathname = usePathname();

  const isActiveRoute = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/browse"
        className={cn(
          'flex items-center justify-between font-medium py-2',
          isActiveRoute('/browse') && 'text-primary'
        )}
        onClick={onLinkClick}
      >
        <span>Giveaways</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
      <Link
        href="/pricing"
        className={cn(
          'flex items-center justify-between font-medium py-2',
          isActiveRoute('/pricing') && 'text-primary'
        )}
        onClick={onLinkClick}
      >
        <span>Pricing</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
      <Link
        href="/contact"
        className={cn(
          'flex items-center justify-between font-medium py-2',
          isActiveRoute('/contact') && 'text-primary'
        )}
        onClick={onLinkClick}
      >
        <span>Contact</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
};
