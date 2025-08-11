import { FeaturedGiveawaysCarousel } from './components/featured-carousel';
import { SubscriptionCTA } from './components/subscription-cta';
import { GiveawayGrid } from './components/giveaway-grid';
import { GiveawayFilters } from './components/giveaway-filters';
import { HostCTA } from './components/host-cta';
import { Suspense } from 'react';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight, Gift } from 'lucide-react';

export default async function BrowsePage() {
  return (
    <div className="min-h-screen bg-background py-6 sm:py-8 lg:py-12 px-2 overflow-hidden space-y-8 sm:space-y-12">
      <section className="text-center sm:container">
        <div className="text-center space-y-1">
          <Link href="/browse/all">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Gift />
              See All Giveaways
              <ArrowRight />
            </Badge>
          </Link>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Typography.Header
              level={1}
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold"
            >
              Featured Giveaways
            </Typography.Header>
          </div>
          <Typography className="text-muted-foreground text-base md:text-lg">
            Don't miss out on these incredible prizes!
          </Typography>
        </div>
      </section>
      <section className="-mx-2 w-screen">
        <Suspense
          fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}
        >
          <FeaturedGiveawaysCarousel />
        </Suspense>
      </section>

      {/* Subscription CTA */}
      <section className="sm:container">
        <SubscriptionCTA />
      </section>

      {/* Filters and Giveaways Grid */}
      <section className="space-y-6 sm:container">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Typography.Header level={2} className="text-2xl font-bold">
              Active Giveaways
            </Typography.Header>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              asChild
            >
              <Link href="/browse/all">
                View All
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <GiveawayFilters />
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
          }
        >
          <GiveawayGrid />
        </Suspense>

        {/* CTA to view all giveaways */}
        <div className="text-center pt-8">
          <Button variant="outline" size="lg" className="px-8" asChild>
            <Link href="/browse/all">
              <Gift />
              See All Current & Past Campaigns
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      {/* Host CTA */}
      <section className="sm:container">
        <HostCTA />
      </section>
    </div>
  );
}
