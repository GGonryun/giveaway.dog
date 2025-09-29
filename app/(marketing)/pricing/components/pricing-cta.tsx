import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { ArrowRightIcon, PiggyBankIcon } from 'lucide-react';
import Link from 'next/link';

export function PricingCTA() {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-8 md:p-12 text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-3 rounded-full">
            <PiggyBankIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
        </div>
        <Typography.Header
          level={2}
          className="text-2xl md:text-3xl font-bold tracking-tight"
        >
          Ready to Save Money on Giveaways?
        </Typography.Header>
        <Typography.Paragraph className="text-muted-foreground max-w-2xl mx-auto">
          Join thousands of businesses who've switched from expensive
          subscriptions to our fair, pay-per-use model.
        </Typography.Paragraph>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/login">Start Your Free Giveaways</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/demo">
              Try The Demo <ArrowRightIcon />
            </Link>
          </Button>
        </div>
        <Typography.Paragraph className="text-xs md:text-sm text-muted-foreground mt-4 md:mt-6">
          No credit card required • 10 free giveaways forever • No subscriptions
          ever!
        </Typography.Paragraph>
      </CardContent>
    </Card>
  );
}
