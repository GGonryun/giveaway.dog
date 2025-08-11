'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Check, Zap, Heart, DollarSign } from 'lucide-react';
import Link from 'next/link';

const features = [
  'Unlimited participants',
  'Social media integrations',
  'Custom entry methods',
  'Analytics & reporting',
  'Email notifications',
  'Winner selection tools',
  'Mobile-optimized pages',
  'Custom branding',
  'Multi-language support',
  'API access',
  'Priority support',
  'Advanced fraud detection'
];

const packages = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    price: 5,
    giveaways: 3,
    pricePerGiveaway: 1.67,
    discount: '0%'
  },
  popular: {
    id: 'popular',
    name: 'Popular Pack',
    price: 20,
    giveaways: 20,
    pricePerGiveaway: 1.0,
    discount: '40% off'
  },
  pro: {
    id: 'pro',
    name: 'Pro Pack',
    price: 50,
    giveaways: 50,
    pricePerGiveaway: 1.0,
    discount: '50% off'
  }
};

export function PricingCards() {
  const [selectedPackage, setSelectedPackage] = useState('popular');
  const currentPackage = packages[selectedPackage as keyof typeof packages];

  return (
    <section className="mb-16 md:mb-20">
      <div className="text-center mb-8 md:mb-12">
        <Typography.Header
          level={2}
          className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4"
        >
          Simple, Fair Pricing
        </Typography.Header>
        <Typography.Paragraph className="text-base md:text-lg text-muted-foreground">
          Every user gets 10 free giveaways with ALL premium features included.
          No feature restrictions, no premium tiers - just choose your package size.
        </Typography.Paragraph>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Free Tier */}
          <Card className="border-2 border-green-200 bg-green-50/50 flex flex-col">
            <CardHeader className="text-center pb-4 md:h-72 flex flex-col justify-center items-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl md:text-2xl mb-3">
                Free Forever
              </CardTitle>
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold">
                  10 Giveaways
                </div>
                <Typography.Paragraph className="text-sm md:text-base text-muted-foreground">
                  Included with every account
                </Typography.Paragraph>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col flex-grow">
              <div className="bg-green-100/50 rounded-lg p-3 mb-4 md:h-20 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <Typography.Header level={5} className="text-sm font-semibold text-green-800">
                    ALL Premium Features Included!
                  </Typography.Header>
                </div>
                <Typography.Paragraph className="text-xs text-green-700">
                  Unlike competitors, we don't lock features behind premium tiers
                </Typography.Paragraph>
              </div>
              
              <div className="space-y-2 md:space-y-3 md:h-80 overflow-y-auto">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm md:text-base">{feature}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" asChild>
                <Link href="/signup">Get Started Free</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Paid Packages */}
          <Card className="border-2 border-primary relative flex flex-col">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-4 py-1">
                Most Popular
              </Badge>
            </div>
            <CardHeader className="text-center pb-4 md:h-72 flex flex-col justify-center items-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              
              {/* Package Selector */}
              <div className="mb-4 w-full max-w-xs mx-auto">
                <Select
                  value={selectedPackage}
                  onValueChange={setSelectedPackage}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(packages).map(([key, pkg]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{pkg.name}</span>
                          {pkg.discount !== '0%' && (
                            <Badge variant="secondary" className="text-xs">
                              {pkg.discount}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <CardTitle className="text-xl md:text-2xl mb-3">
                {currentPackage.name}
              </CardTitle>
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold">
                  ${currentPackage.price}
                </div>
                <Typography.Paragraph className="text-sm md:text-base text-muted-foreground">
                  {currentPackage.giveaways} giveaways • $
                  {currentPackage.pricePerGiveaway.toFixed(2)} each
                </Typography.Paragraph>
                {currentPackage.discount !== '0%' && (
                  <Badge variant="secondary" className="text-xs">
                    {currentPackage.discount}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col flex-grow">
              <div className="bg-primary/10 rounded-lg p-3 mb-4 md:h-20 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-primary" />
                  <Typography.Header level={5} className="text-sm font-semibold text-primary">
                    Same Features as Free Tier
                  </Typography.Header>
                </div>
                <Typography.Paragraph className="text-xs text-primary/80">
                  Just more giveaways - no feature upgrades needed
                </Typography.Paragraph>
              </div>
              
              <div className="space-y-2 md:space-y-3 md:h-80 overflow-y-auto">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm md:text-base">{feature}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" asChild>
                <Link href="/signup">Start Your Giveaways</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Value Proposition */}
        <div className="mt-12 md:mt-16 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 md:p-8 text-center">
          <Typography.Header
            level={3}
            className="text-xl md:text-2xl font-bold mb-4"
          >
            Why Our Model Works Better
          </Typography.Header>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <DollarSign className="w-8 h-8 text-primary mx-auto" />
              <Typography.Header level={4} className="font-semibold">
                No Wasted Money
              </Typography.Header>
              <Typography.Paragraph className="text-sm text-muted-foreground">
                Only pay when you're actually running a campaign
              </Typography.Paragraph>
            </div>
            <div className="space-y-2">
              <Zap className="w-8 h-8 text-primary mx-auto" />
              <Typography.Header level={4} className="font-semibold">
                All Features, Always Free
              </Typography.Header>
              <Typography.Paragraph className="text-sm text-muted-foreground">
                Every feature included from day one - no premium tiers ever
              </Typography.Paragraph>
            </div>
            <div className="space-y-2">
              <Heart className="w-8 h-8 text-primary mx-auto" />
              <Typography.Header level={4} className="font-semibold">
                Scale With You
              </Typography.Header>
              <Typography.Paragraph className="text-sm text-muted-foreground">
                Perfect for businesses of all sizes
              </Typography.Paragraph>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}