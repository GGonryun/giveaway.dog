'use client';

import { Button, ButtonVariant } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { ArrowRightIcon, Check } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MarketingHeader, MarketingTitle } from './shared';

type PricingTier = {
  title: string;
  badge: {
    text: string;
    variant: 'secondary' | 'default' | 'destructive';
  };
  subtitle: string;
  price: string | number;
  priceSubtext: string;
  features: React.ReactNode[];
  border?: boolean;
  buttonText: string;
  buttonLink: string;
  buttonVariant: ButtonVariant;
  buttonIcon: React.ReactNode;
  buttonSubtext: string;
};

const sharedFeatures = {
  team: '1 team',
  humanSupport: 'Human support'
};

// Pricing constants
const MONTHLY_PRICE = 5;
const YEARLY_DISCOUNT_RATE = 0.4; // 40% off
const YEARLY_PRICE_PER_MONTH = MONTHLY_PRICE * (1 - YEARLY_DISCOUNT_RATE);
const YEARLY_TOTAL = YEARLY_PRICE_PER_MONTH * 12;
const YEARLY_SAVINGS = (MONTHLY_PRICE - YEARLY_PRICE_PER_MONTH) * 12;

const GradientText: React.FC<{ children: React.ReactNode }> = ({
  children
}) => (
  <span className="bg-gradient-to-r from-primary via-black dark:via-white to-primary bg-clip-text text-transparent font-bold animate-gradient">
    {children}
  </span>
);

export const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    'monthly'
  );

  const proPrice =
    billingCycle === 'monthly' ? MONTHLY_PRICE : YEARLY_PRICE_PER_MONTH;

  const tiers: PricingTier[] = [
    {
      title: 'Creator',
      badge: { text: 'Beta', variant: 'secondary' },
      subtitle: 'Best for small creators',
      price: 'Free',
      priceSubtext: 'No credit card required',
      buttonSubtext: 'Try it now!',
      buttonText: 'Request Access',
      buttonLink: '/contact',
      buttonIcon: <ArrowRightIcon />,
      buttonVariant: 'outline',
      features: [
        sharedFeatures.team,
        '3 seats',
        'Up to 3 concurrent giveaways',
        '10 giveaways a month',
        'All entry methods enabled',
        'Up to 10 entry methods per giveaway',
        'Unlisted giveaways only',
        'Up to 10 integrations',
        'Unlimited participants',
        sharedFeatures.humanSupport
      ]
    },
    {
      title: 'Pro',
      badge: {
        text: 'Best deal',
        variant: 'default'
      },
      subtitle: 'Best for bigger brands',
      price: proPrice,
      priceSubtext:
        billingCycle === 'yearly'
          ? `Billed as $${YEARLY_TOTAL.toFixed(2)}/year`
          : '',
      border: true,
      buttonSubtext: 'Billed monthly or yearly',
      buttonText: 'Contact Us',
      buttonLink: '/login',
      buttonIcon: <ArrowRightIcon />,
      buttonVariant: 'default',
      features: [
        <GradientText>Unlimited giveaways</GradientText>,
        <GradientText>Unlimited entry methods</GradientText>,
        sharedFeatures.team,
        'Unlimited seats',
        'All entry methods',
        'Public giveaways',
        'Verified badge',
        'More design customization',
        'Unlimited integrations',
        sharedFeatures.humanSupport
      ]
    }
    // {
    //   title: 'Enterprise',
    //   badge: { text: 'Big dogs only', variant: 'destructive' },
    //   subtitle: 'Pay once, use forever',
    //   price: 2999,
    //   priceSubtext: 'one-time payment',
    //   buttonSubtext: 'Contact us for more info',
    //   buttonText: 'Contact Us',
    //   buttonLink: '/contact',
    //   buttonIcon: <ArrowRightIcon />,
    //   buttonVariant: 'outline',
    //   features: [
    //     <GradientText>Everything in Pro</GradientText>,
    //     <GradientText>Lifetime access</GradientText>,
    //     'No recurring fees',
    //     'Priority support',
    //     'Early access to new features',
    //     'Dedicated account manager',
    //     'Custom branding options',
    //     'API access',
    //     'Advanced analytics',
    //     'White-label options'
    //   ]
    // }
  ];

  return (
    <section
      id="pricing"
      className="bg-secondary/30 w-full flex items-center justify-center"
    >
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12 relative">
          <MarketingHeader
            title={{
              text: 'Get more views with less effort',
              highlight: 'with less effort'
            }}
            subtitle={{
              text: 'Flexible pricing options for creators of all sizes.'
            }}
            actions={[]}
          />
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="inline-flex items-center rounded-lg border bg-muted p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <div className="relative">
                <Badge className="absolute -top-3 left-16 text-xs">
                  Save {(YEARLY_DISCOUNT_RATE * 100).toFixed(0)}%
                </Badge>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-8 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingCycle === 'yearly'
                      ? 'bg-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {tiers.map((tier) => (
            <Card
              key={tier.title}
              className={cn(
                `p-4 flex flex-col relative shadow-xl`,
                tier.border && 'border-2 border-primary'
              )}
            >
              {tier.title === 'Pro' && billingCycle === 'yearly' && (
                <Badge
                  variant="default"
                  className="absolute top-4 right-4 text-xs z-10"
                >
                  {(YEARLY_DISCOUNT_RATE * 100).toFixed(0)}% OFF
                </Badge>
              )}
              <CardHeader className="pb-2 pt-6 lg:pt-8">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl lg:text-2xl font-bold">
                    {tier.title}
                  </h3>
                  <Badge variant={tier.badge.variant} className="text-xs">
                    {tier.badge.text}
                  </Badge>
                </div>
                <Typography.Paragraph className="text-sm text-muted-foreground">
                  {tier.subtitle}
                </Typography.Paragraph>
                <div
                  className={cn(
                    'mt-4',
                    billingCycle === 'yearly' ? 'min-h-[90px]' : 'min-h-[75px]'
                  )}
                >
                  {typeof tier.price === 'number' ? (
                    <div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-4xl lg:text-5xl font-bold">
                          ${tier.price}
                        </span>
                        {tier.title === 'Pro' && (
                          <span className="text-lg text-muted-foreground">
                            /month
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-4xl lg:text-5xl font-bold">
                      {tier.price}
                    </div>
                  )}
                  {tier.priceSubtext && (
                    <Typography.Paragraph className="text-sm text-muted-foreground mt-1">
                      {tier.priceSubtext}
                    </Typography.Paragraph>
                  )}
                  {tier.title === 'Pro' && billingCycle === 'yearly' && (
                    <Typography.Paragraph
                      className="text-primary text-sm font-medium
                     mt-0.5"
                    >
                      Save ${YEARLY_SAVINGS.toFixed(2)}/year (
                      {(YEARLY_DISCOUNT_RATE * 100).toFixed(0)}% off)
                    </Typography.Paragraph>
                  )}
                </div>
              </CardHeader>
              <CardContent className="mt-0 pt-0 flex-1 flex flex-col">
                <div className="space-y-2.5 lg:space-y-3 flex-1">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>{feature}</div>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  variant={tier.buttonVariant}
                  className="w-full mt-4 lg:mt-6"
                  asChild
                >
                  <Link href={tier.buttonLink}>
                    {tier.buttonText} {tier.buttonIcon}
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {tier.buttonSubtext}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
