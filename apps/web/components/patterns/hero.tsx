'use server';

import { HeroSweepstakesPreview } from './hero-sweepstakes-preview';
import { Suspense } from 'react';
import { ArrowRight } from 'lucide-react';
import { SocialPlatformsCarousel } from './social-platforms-carousel';
import { MarketingHeader } from './shared';
import { getServerTheme } from '@/lib/theme/get-server-theme';
import { AvatarGroupEasterEgg } from './avatar-group-easter-egg';

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

export const Hero = async () => {
  const theme = await getServerTheme();

  return (
    <section className="w-full flex flex-col items-center justify-center bg-linear-to-t from-primary/15 to-background">
      <div className="w-full pb-0 sm:pb-1 md:pb-1.5 lg:pb-2 pt-6 sm:pt-10 md:pt-14 lg:pt-18">
        <SocialPlatformsCarousel initialTheme={theme} />
      </div>
      <div className="container flex items-center justify-center">
        <div className="grid items-center gap-8 pt-6 sm:pt-8 md:pt-10 lg:pt-12 pb-12">
          <MarketingHeader
            title={{
              text: 'How creators build bigger communities',
              highlight: 'bigger communities'
            }}
            subtitle={{
              text: 'Host verified giveaways in under 60 seconds that grow your community without bots or spam.'
            }}
            actions={[
              {
                label: 'Giveaways',
                href: '/browse',
                variant: 'outline'
              },
              {
                label: (
                  <>
                    Try it for free <ArrowRight />
                  </>
                ),
                href: '/demo/sweepstakes'
              }
            ]}
          />
          <div className="flex flex-col w-full items-center gap-0">
            <Hosts />
            <div className="my-2 sm:my-1.5 md:my-0.5 lg:my-0" />
            <Preview />
          </div>
        </div>
      </div>
    </section>
  );
};

const Hosts = () => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
      <AvatarGroupEasterEgg hosts={HOSTS} />
      <div className="text-lg text-muted-foreground/80">
        Chosen by{' '}
        <span className="font-semibold text-foreground">{HOST_COUNT}</span>{' '}
        giveaway hosts
      </div>
    </div>
  );
};

const Preview = () => {
  return (
    <Suspense>
      <HeroSweepstakesPreview />
    </Suspense>
  );
};
