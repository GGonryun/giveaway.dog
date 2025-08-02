import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TakiEasterEgg } from './taki-easter-egg';

export const Hero = () => {
  return (
    <section className="container">
      <div className="grid items-center gap-8">
        <div className="flex flex-col items-center text-center">
          <TakiEasterEgg />
          <h1 className="my-6 text-pretty text-4xl font-bold lg:text-6xl">
            Grow Your Pack
          </h1>
          <p className="text-muted-foreground mb-8 max-w-xl lg:text-xl">
            Giveaway Dog provides a suite of marketing apps that help creators
            build real community with no monthly fees and no fluff.
          </p>
          <div className="flex w-full flex-col justify-center gap-2 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <a href={'/app/host'}>Run a giveaway</a>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <a href={'/examples'}>
                See Live Examples
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
