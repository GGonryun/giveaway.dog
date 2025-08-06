import { ArrowRight, ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '../ui/badge';
import Link from 'next/link';

export const Hero = () => {
  return (
    <section className="container">
      <div className="grid items-center gap-8">
        <div className="flex flex-col items-center text-center">
          <Link href={'/support'} className="text-sm mb-2">
            <Badge variant="outline">
              🦮 Talk to a human
              <ArrowUpRight className="ml-1 size-4" />
            </Badge>
          </Link>
          <h1 className="my-6 text-pretty text-4xl font-bold lg:text-6xl">
            How creators{' '}
            <span className="text-primary">build bigger communities</span>
          </h1>
          <p className="text-muted-foreground mb-8 max-w-xl lg:text-xl">
            The easiest giveaway platform for growing your community.
          </p>
          <div className="flex w-full flex-col justify-center gap-2 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <a href={'/signup'}>Get started - free</a>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <a href={'/examples'}>Explore giveaways</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
