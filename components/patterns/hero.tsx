'use server';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HeroSweepstakesPreview } from './hero-sweepstakes-preview';
import { Suspense } from 'react';
import { ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import Image from 'next/image';
import { SocialPlatformsCarousel } from './social-platforms-carousel';

const HOST_COUNT = 'over 30';
const HOSTS = [
  {
    label: 'ebidi',
    fallback: 'AD',
    image: '/hosts/ebidi.jpg'
  },
  {
    label: 'kurozzz',
    fallback: 'KZ',
    image: '/hosts/kurozzz.jpg'
  },
  {
    label: 'h7',
    fallback: 'H7',
    image: '/hosts/h7.jpg'
  },
  {
    label: 'theejankanator',
    fallback: 'TJ',
    image: '/hosts/theejankanator.jpg'
  },
  {
    label: 'l1ghtervibes',
    fallback: 'LV',
    image: '/hosts/l1ghtervibes.jpg'
  },
  {
    label: 'toniii',
    fallback: 'TO',
    image: '/hosts/toniii.jpg'
  },
  {
    label: 'szamer',
    fallback: 'SZ',
    image: '/hosts/szamer.jpg'
  }
];

export const Hero = async () => (
  <section className="w-full flex flex-col items-center justify-center bg-gradient-to-t from-primary/15 to-transparent">
    <div className="w-full pt-6 sm:pt-10 md:pt-14 lg:pt-18">
      <SocialPlatformsCarousel />
    </div>
    <div className="container flex items-center justify-center">
      <div className="grid items-center gap-8 pt-6 sm:pt-8 md:pt-10 lg:pt-12 pb-12">
        <div className="flex flex-col items-center text-center gap-2">
          <Title />
          <div />
          <Subtitle />
          <div className="my-1" />
          <CTA />
        </div>
        <div className="flex flex-col w-full items-center gap-0">
          <div className="my-0 sm:my-1 md:my-1.5 lg:my-2" />
          <Hosts />
          <div className="my-1" />
          <Preview />
        </div>
      </div>
    </div>
  </section>
);

const GlowingPill = () => {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      Unified Sweepstakes Platform
    </div>
  );
};

const Title = () => {
  return (
    <h1 className="max-w-xl font-semibold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter text-foreground text-balance">
      How creators build{' '}
      <span className="text-primary">bigger communities</span>
    </h1>
  );
};

const Subtitle = () => {
  return (
    <p className="text-muted-foreground text-base sm:text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto text-pretty">
      Host verified giveaways in under 60 seconds that grow your community
      without bots or spam.
    </p>
  );
};

const CTA = () => {
  return (
    <div className="flex w-full flex-col justify-center gap-2 sm:flex-row">
      <Button size="xxl" asChild variant="outline" className="w-full sm:w-auto">
        <Link href={'/browse'}>Giveaways</Link>
      </Button>
      <Button size="xxl" asChild className="w-full sm:w-auto">
        <Link href={'/demo/sweepstakes'}>
          Try it for free <ArrowRight />
        </Link>
      </Button>
    </div>
  );
};

const Hosts = () => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
      <AvatarGroup />
      <div className="text-lg text-muted-foreground/80">
        Chosen by{' '}
        <span className="font-semibold text-foreground">{HOST_COUNT}</span>{' '}
        giveaway hosts
      </div>
    </div>
  );
};

const AvatarGroup = () => (
  <div className="flex flex-row -space-x-2">
    {HOSTS.map((host) => (
      <BorderedAvatar
        key={host.label}
        src={host.image}
        fallback={host.fallback}
      />
    ))}
  </div>
);

const BorderedAvatar = ({
  src,
  fallback
}: {
  src: string;
  fallback: string;
}) => {
  return (
    <Avatar className="border-4 border-background w-12 h-12">
      <Image
        src={src}
        alt={fallback}
        width={48}
        height={48}
        className="aspect-square w-full h-full"
      />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
};

const Preview = () => {
  return (
    <Suspense>
      <HeroSweepstakesPreview />
    </Suspense>
  );
};
