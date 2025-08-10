import { FeaturedGiveawaysCarousel } from './components/featured-carousel';
import { SubscriptionCTA } from './components/subscription-cta';
import { GiveawayGrid } from './components/giveaway-grid';
import { GiveawayFilters } from './components/giveaway-filters';
import { Suspense } from 'react';

export default async function BrowsePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Featured Giveaways Carousel */}
        <section className="mb-12">
          <Suspense fallback={
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          }>
            <FeaturedGiveawaysCarousel />
          </Suspense>
        </section>

        {/* Subscription CTA */}
        <section className="mb-8">
          <SubscriptionCTA />
        </section>

        {/* Filters and Giveaways Grid */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-2xl font-bold">Active Giveaways</h2>
            <GiveawayFilters />
          </div>
          
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          }>
            <GiveawayGrid />
          </Suspense>
        </section>
      </div>
    </div>
  );
}