import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '../ui/badge';
import Link from 'next/link';

export const Hero = () => {
  return (
    <section className="container">
      <div className="grid items-center gap-8">
        <div className="flex flex-col items-center text-center">
          <Link href={'/support'} className="text-sm mb-2">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              🕺 Talk to a human
              <ArrowRight className="w-4 h-4 mr-1" />
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
              <Link href={'/signup'}>Get started - free</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={'/browse'}>Explore giveaways</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
