import { Card, CardContent } from '@/components/ui/card';

interface Step {
  title: string;
  description: string;
}

interface HowItWorksSectionProps {
  title: string;
  steps: Step[];
}

export function HowItWorksSection({ title, steps }: HowItWorksSectionProps) {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <h3 className="font-semibold text-xl mb-6 text-center">{title}</h3>
        <div
          className={`grid gap-6 ${
            steps.length === 3
              ? 'md:grid-cols-3'
              : steps.length === 4
                ? 'md:grid-cols-4'
                : 'md:grid-cols-2 lg:grid-cols-' + steps.length
          }`}
        >
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                {index + 1}
              </div>
              <h4 className="font-medium mb-2">{step.title}</h4>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
