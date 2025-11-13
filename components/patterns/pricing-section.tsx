'use server';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

export const PricingSection = async () => {
  return (
    <section className="w-full flex items-center justify-center">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <Typography.Header
            level={2}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
          >
            Simple, transparent pricing
          </Typography.Header>
          <Typography.Paragraph className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pay only for what you use. No hidden fees, no surprises.
          </Typography.Paragraph>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-primary">
            <CardContent className="p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="text-5xl md:text-6xl font-bold mb-2">
                  $2,999
                </div>
                <Typography.Paragraph className="text-lg text-muted-foreground">
                  One-time payment • Lifetime access
                </Typography.Paragraph>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Unlimited giveaways forever</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>All premium features included</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Priority support & dedicated contact</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Advanced analytics & custom reporting</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 items-center">
                <Button size="lg" className="w-full" asChild>
                  <Link href="mailto:admin@giveaway.dog?subject=Lifetime Subscription Inquiry">
                    Get Lifetime Access <ArrowRight />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
