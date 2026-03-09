import { Card, CardContent } from '@/components/ui/card';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';
import { Shield, Zap, Sliders, DollarSign } from 'lucide-react';
import { PUBLIC_PICKER_MAX_WINNERS } from '../constants';

const benefits = [
  {
    icon: Shield,
    title: 'Fair & Transparent',
    description:
      'Provably random selection ensures every participant has an equal chance of winning your giveaway.'
  },
  {
    icon: Sliders,
    title: 'Advanced Filters',
    description:
      'Filter by followers, account age, profile completeness, and more to ensure quality winners.'
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description:
      'Get your winners in seconds, not hours. No waiting, no manual work, just instant results.'
  },
  {
    icon: DollarSign,
    title: 'Free to Use',
    description: `Pick up to ${PUBLIC_PICKER_MAX_WINNERS} winners for free. No credit card required, no hidden fees, no surprises.`
  }
];

export function PickerBenefitsSection() {
  return (
    <section className="w-full mb-12">
      <MarketingPageHeader
        title="Why Use Our Tool?"
        description="The fastest, fairest way to select winners from your X giveaways"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <Card key={index} className="border-2">
              <CardContent className="flex gap-4">
                <div className="shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
