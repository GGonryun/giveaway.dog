'use server';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HeroSweepstakesPreview } from './hero-sweepstakes-preview';
import { Suspense } from 'react';

export const Hero = async () => (
  <section className="w-full flex items-center justify-center bg-gradient-to-t from-primary/15 to-transparent">
    <div className="container flex items-center justify-center">
      <div className="grid items-center gap-8 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Unified Sweepstakes Platform
          </div>
          <h1 className="max-w-xl text-4xl font-semibold font-outfit tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance mb-4">
            How creators build{' '}
            <span className="text-primary">bigger communities</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8 text-pretty">
            Host verified giveaways in under 60 seconds that grow your community
            without bots or spam. Simple, fast, and built for creators. No
            subscriptions, no restrictions, no surprises.
          </p>
          <div className="flex w-full flex-col justify-center gap-2 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link href={'/demo/sweepstakes'}>Try The Demo - Free</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={'/browse'}>Giveaways</Link>
            </Button>
          </div>
        </div>
        <Suspense>
          <HeroSweepstakesPreview />
        </Suspense>
      </div>
    </div>
  </section>
);
