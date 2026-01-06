'use client';

import { ChevronRight, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface MobileNavLinks {
  onLinkClick: () => void;
}

export const MobileNavLinks: React.FC<MobileNavLinks> = ({ onLinkClick }) => {
  const pathname = usePathname();
  const [learnExpanded, setLearnExpanded] = useState(false);

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

      <div className="flex flex-col">
        <button
          onClick={() => setLearnExpanded(!learnExpanded)}
          className={cn(
            'flex items-center justify-between font-medium py-2 text-left',
            pathname?.startsWith('/learn') && 'text-primary'
          )}
        >
          <span>Learn</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              learnExpanded && 'rotate-180'
            )}
          />
        </button>
        {learnExpanded && (
          <div className="flex flex-col gap-3 pl-6 mt-2">
            <Link
              href="/learn/integrations"
              className={cn(
                'flex items-center justify-between py-2 text-sm',
                isActiveRoute('/learn/integrations')
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              )}
              onClick={onLinkClick}
            >
              <span>Integrations</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/learn/templates"
              className={cn(
                'flex items-center justify-between py-2 text-sm',
                isActiveRoute('/learn/templates')
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              )}
              onClick={onLinkClick}
            >
              <span>Templates</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

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
