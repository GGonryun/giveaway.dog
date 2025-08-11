import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import { Check, X, Star, Zap, Heart, DollarSign } from 'lucide-react';
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

const competitors = [
  {
    name: 'Rafflecopter',
    monthlyPrice: '$49',
    annualPrice: '$39',
    limitations: [
      'Limited entries per month',
      'Basic integrations only',
      'No API access'
    ],
    yearlyTotal: '$468'
  },
  {
    name: 'Gleam',
    monthlyPrice: '$99',
    annualPrice: '$79',
    limitations: ['Entry caps', 'Limited campaigns', 'Premium features locked'],
    yearlyTotal: '$948'
  },
  {
    name: 'Woobox',
    monthlyPrice: '$29',
    annualPrice: '$24',
    limitations: ['Contest limits', 'Branding restrictions', 'Basic analytics'],
    yearlyTotal: '$288'
  },
  {
    name: 'KingSumo',
    monthlyPrice: '$59',
    annualPrice: '$49',
    limitations: [
      'Campaign restrictions',
      'Limited integrations',
      'Basic support'
    ],
    yearlyTotal: '$588'
  }
];

export default async function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Star className="w-4 h-4 mr-1" />
            Revolutionary Pricing Model
          </Badge>
          <Typography.H1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Pay Only When You Run Giveaways
          </Typography.H1>
          <Typography className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Unlike our competitors who charge monthly subscriptions even when
            you're not running campaigns, we believe you should only pay for
            what you use. No subscriptions, no recurring fees, no surprises.
          </Typography>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Start Free Today</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/browse">See Live Examples</Link>
            </Button>
          </div>
        </div>

        {/* Our Pricing Model */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <Typography.H2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Fair Pricing
            </Typography.H2>
            <Typography className="text-lg text-muted-foreground">
              Every user gets 10 free giveaways to start, then pay only $1 per
              additional giveaway
            </Typography>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <Card className="border-2 border-muted">
              <CardHeader className="text-center">
                <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-secondary" />
                </div>
                <CardTitle className="text-2xl">Free Forever</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">10 Giveaways</div>
                  <Typography className="text-muted-foreground">
                    Included with every account
                  </Typography>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {features.slice(0, 6).map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Mobile-optimized pages</span>
                  </div>
                </div>
                <Button className="w-full" asChild>
                  <Link href="/signup">Get Started Free</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pay Per Giveaway */}
            <Card className="border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Pay Per Giveaway</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">$1</div>
                  <Typography className="text-muted-foreground">
                    per additional giveaway
                  </Typography>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full" asChild>
                  <Link href="/signup">Start Your First Giveaway</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Value Proposition */}
          <div className="mt-16 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-8 text-center">
            <Typography.H3 className="text-2xl font-bold mb-4">
              Why Our Model Works Better
            </Typography.H3>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="space-y-2">
                <DollarSign className="w-8 h-8 text-primary mx-auto" />
                <h4 className="font-semibold">No Wasted Money</h4>
                <p className="text-sm text-muted-foreground">
                  Only pay when you're actually running a campaign
                </p>
              </div>
              <div className="space-y-2">
                <Zap className="w-8 h-8 text-primary mx-auto" />
                <h4 className="font-semibold">All Features Included</h4>
                <p className="text-sm text-muted-foreground">
                  No feature tiers or premium lockouts
                </p>
              </div>
              <div className="space-y-2">
                <Heart className="w-8 h-8 text-primary mx-auto" />
                <h4 className="font-semibold">Scale With You</h4>
                <p className="text-sm text-muted-foreground">
                  Perfect for businesses of all sizes
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Competitor Comparison */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <Typography.H2 className="text-3xl md:text-4xl font-bold mb-4">
              Compare With Competitors
            </Typography.H2>
            <Typography className="text-lg text-muted-foreground">
              See how much you could save by switching to our pay-per-use model
            </Typography>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] mx-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Service</th>
                  <th className="text-center p-4 font-semibold">
                    Monthly Price
                  </th>
                  <th className="text-center p-4 font-semibold">
                    Annual Price
                  </th>
                  <th className="text-center p-4 font-semibold">
                    Yearly Total
                  </th>
                  <th className="text-left p-4 font-semibold">Limitations</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-primary/5">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <strong>Giveaway.dog</strong>
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    </div>
                  </td>
                  <td className="text-center p-4">
                    <span className="text-green-600 font-semibold">$0</span>
                  </td>
                  <td className="text-center p-4">
                    <span className="text-green-600 font-semibold">$0</span>
                  </td>
                  <td className="text-center p-4">
                    <span className="text-green-600 font-semibold">
                      $0-$10*
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">No limitations</span>
                    </div>
                  </td>
                </tr>
                {competitors.map((competitor) => (
                  <tr key={competitor.name} className="border-b">
                    <td className="p-4 font-medium">{competitor.name}</td>
                    <td className="text-center p-4">
                      {competitor.monthlyPrice}
                    </td>
                    <td className="text-center p-4">
                      {competitor.annualPrice}/mo
                    </td>
                    <td className="text-center p-4 font-semibold text-red-600">
                      {competitor.yearlyTotal}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {competitor.limitations.map((limitation) => (
                          <div
                            key={limitation}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <X className="w-3 h-3 flex-shrink-0" />
                            <span className="text-xs">{limitation}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <Typography className="text-sm text-muted-foreground">
              * Based on 10 free giveaways per year. Additional giveaways at $1
              each.
              <br />
              Most users never exceed their free allocation.
            </Typography>
          </div>
        </section>

        {/* Use Case Examples */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <Typography.Header level={2} className="text-3xl md:text-4xl font-bold mb-4">
              Real-World Savings
            </Typography.Header>
            <Typography className="text-lg text-muted-foreground">
              See how different types of businesses save with our pricing model
            </Typography>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Small Business</CardTitle>
                <Typography className="text-muted-foreground text-sm">
                  Runs 2-3 seasonal giveaways per year
                </Typography>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">With Giveaway.dog:</span>
                    <span className="font-semibold text-green-600">
                      $0/year
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">With competitors:</span>
                    <span className="font-semibold text-red-600">
                      $288-$948/year
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-center">
                    <span className="text-lg font-bold text-green-600">
                      Save 100%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Growing Brand</CardTitle>
                <Typography className="text-muted-foreground text-sm">
                  Runs 15 giveaways per year
                </Typography>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">With Giveaway.dog:</span>
                    <span className="font-semibold text-green-600">
                      $5/year
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">With competitors:</span>
                    <span className="font-semibold text-red-600">
                      $288-$948/year
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-center">
                    <span className="text-lg font-bold text-green-600">
                      Save $283-$943
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enterprise</CardTitle>
                <Typography className="text-muted-foreground text-sm">
                  Runs 50+ giveaways per year
                </Typography>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">With Giveaway.dog:</span>
                    <span className="font-semibold text-green-600">
                      $40/year
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">With competitors:</span>
                    <span className="font-semibold text-red-600">
                      $288-$948/year
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-center">
                    <span className="text-lg font-bold text-green-600">
                      Save $248-$908
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <Typography.H2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </Typography.H2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Do the 10 free giveaways expire?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Typography className="text-muted-foreground">
                  No! Your 10 free giveaways never expire. Use them whenever
                  you're ready, whether that's next month or next year.
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Are there any hidden fees?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Typography className="text-muted-foreground">
                  Absolutely not. We believe in transparent pricing. The only
                  cost is $1 per giveaway after you've used your 10 free ones.
                  No setup fees, no monthly charges, no surprises.
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  What features are included?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Typography className="text-muted-foreground">
                  Everything! Unlike competitors who gate features behind
                  premium tiers, every user gets access to all features
                  including analytics, integrations, custom branding, and
                  priority support.
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Can I upgrade or downgrade anytime?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Typography className="text-muted-foreground">
                  There's nothing to upgrade! Since you only pay per giveaway,
                  you automatically scale up or down based on your usage. Run 50
                  giveaways one month and 2 the next - you only pay for what you
                  use.
                </Typography>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-12">
          <Typography.H2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Save Money on Giveaways?
          </Typography.H2>
          <Typography className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of businesses who've switched from expensive
            subscriptions to our fair, pay-per-use model.
          </Typography>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Start Your Free Giveaways</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/app">See Dashboard Demo</Link>
            </Button>
          </div>
          <Typography className="text-sm text-muted-foreground mt-6">
            No credit card required • 10 free giveaways forever • Cancel anytime
            (there's nothing to cancel!)
          </Typography>
        </section>
      </div>
    </div>
  );
}
