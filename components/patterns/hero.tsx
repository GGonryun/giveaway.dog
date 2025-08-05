import { ArrowRight, ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '../ui/badge';

export const Hero = () => {
  return (
    <section className="container">
      <div className="grid items-center gap-8">
        <div className="flex flex-col items-center text-center">
          <h1 className="my-6 text-pretty text-4xl font-bold lg:text-6xl">
            How creators{' '}
            <span className="text-primary">build bigger communities</span>
          </h1>
          <p className="text-muted-foreground mb-8 max-w-xl lg:text-xl">
            The easiest giveaway platform for growing your community.
          </p>
          <div className="flex w-full flex-col justify-center gap-2 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <a href={'/app/host'}>Get started - free</a>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <a href={'/examples'}>Explore giveaways</a>
            </Button>
          </div>
          <a href={'/examples'} className="text-sm mt-6">
            <Badge variant="outline">
              ✨ See examples
              <ArrowUpRight className="ml-2 size-4" />
            </Badge>
          </a>
        </div>
      </div>
    </section>
  );
};
