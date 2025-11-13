import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';

export function PricingCTA() {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-8 md:p-12 text-center space-y-6">
        <Typography.Header
          level={2}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
        >
          Ready to save time on your giveaways?
        </Typography.Header>
        <Typography.Paragraph className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join teams who've switched from expensive subscriptions to our fair,
          unlimited pricing model.{' '}
        </Typography.Paragraph>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/login">Get started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/demo/sweepstakes">
              Try The Demo <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
