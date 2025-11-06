import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';
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
      <div className="mb-8">
        <MarketingPageHeader
          icon={Star}
          title="No Monthly Fees"
          description="Our unique pricing model ensures you only pay for what you use."
        />
      </div>

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
