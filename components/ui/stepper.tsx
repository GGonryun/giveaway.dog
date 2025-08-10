import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function Stepper({ currentStep, totalSteps, className }: StepperProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isUpcoming = stepNumber > currentStep;

        return (
          <div key={stepNumber} className="flex items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                isCompleted &&
                  'bg-primary border-primary text-primary-foreground',
                isCurrent && 'border-primary text-primary bg-background',
                isUpcoming && 'border-muted-foreground text-muted-foreground'
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
            </div>
            {stepNumber < totalSteps && (
              <div
                className={cn(
                  'mx-4 h-0.5 w-12 transition-colors',
                  isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
