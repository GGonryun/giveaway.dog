import { Card, CardContent } from '@/components/ui/card';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';
import { Link2, Filter, Sparkles, Trophy } from 'lucide-react';

const steps = [
  {
    icon: Link2,
    step: 1,
    title: 'Paste Your Post URL',
    description:
      'Enter the URL of your X giveaway post. We automatically fetch the tweet details and participant data.'
  },
  {
    icon: Filter,
    step: 2,
    title: 'Set Your Filters',
    description:
      'Configure optional filters like minimum followers, account age, or profile requirements to ensure quality participants.'
  },
  {
    icon: Sparkles,
    step: 3,
    title: 'Pick Random Winners',
    description:
      'Our algorithm randomly selects winners from qualifying participants. The selection is instant and completely fair.'
  },
  {
    icon: Trophy,
    step: 4,
    title: 'Share Your Results',
    description:
      'Get a shareable results page with your winners. Announce them with confidence knowing the draw was transparent.'
  }
];

export function PickerHowItWorksSection() {
  return (
    <section className="w-full mt-32 mb-12">
      <MarketingPageHeader
        title="How It Works"
        component="h2"
        description="Select random winners from your X giveaway in four simple steps"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.step} className="border-2">
              <CardContent className="flex gap-4">
                <div className="shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    Step {step.step}
                  </p>
                  <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
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
