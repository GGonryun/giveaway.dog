import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import Link from 'next/link';

export function PricingCTA() {
  return (
    <section className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-8 md:p-12">
      <Typography.Header
        level={2}
        className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4"
      >
        Ready to Save Money on Giveaways?
      </Typography.Header>
      <Typography.Paragraph className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
        Join thousands of businesses who've switched from expensive
        subscriptions to our fair, pay-per-use model.
      </Typography.Paragraph>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" asChild>
          <Link href="/signup">Start Your Free Giveaways</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/demo/dashboard">See Dashboard Demo</Link>
        </Button>
      </div>
      <Typography.Paragraph className="text-xs md:text-sm text-muted-foreground mt-4 md:mt-6">
        No credit card required • 10 free giveaways forever • No
        subscriptions ever!
      </Typography.Paragraph>
    </section>
  );
}