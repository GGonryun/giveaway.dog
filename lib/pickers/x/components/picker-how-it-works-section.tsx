import { Card, CardContent } from '@/components/ui/card';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';
import { Link2, Filter, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: Link2,
    title: 'Paste Your Post URL',
    description:
      'Enter the URL of your X post with the giveaway. We automatically fetch all retweets and participant data.'
  },
  {
    icon: Filter,
    title: 'Set Your Filters',
    description:
      'Configure optional filters like minimum followers, account age, or profile requirements to ensure quality participants.'
  },
  {
    icon: Sparkles,
    title: 'Pick Random Winners',
    description:
      'Our algorithm randomly selects winners from qualifying participants. Results are instant and completely transparent.'
  }
];

export function PickerHowItWorksSection() {
  return (
    <section className="w-full mb-12">
      <MarketingPageHeader
        title="How to Pick Winners"
        description="Select random winners from your X giveaway in three simple steps"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={index} className="border-2">
              <CardContent className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
