import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Star } from 'lucide-react';
import Link from 'next/link';

export function PricingHero() {
  return (
    <div className="text-center mb-12 md:mb-16">
      <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
        <Star className="w-4 h-4 mr-1" />
        Revolutionary Pricing Model
      </Badge>
      <Typography.Header
        level={1}
        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6"
      >
        Pay Only When You Run Giveaways
      </Typography.Header>
      <Typography.Paragraph className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 md:mb-8">
        Unlike our competitors who charge monthly subscriptions and lock
        features behind premium tiers, we give you ALL features for free and you
        only pay for the giveaways you actually run. No subscriptions, no
        feature restrictions, no surprises.
      </Typography.Paragraph>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" asChild>
          <Link href="/login">Start Free Today</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/browse">See Live Examples</Link>
        </Button>
      </div>
    </div>
  );
}
