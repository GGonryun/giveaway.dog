'use client';

import Link from 'next/link';
import { Button } from '@giveaway/ui-primitives/button';
import {
  GemIcon,
  Sparkles,
  Zap,
  Shield,
  LucideIcon,
  ArrowRight
} from 'lucide-react';
import { SocialXIcon } from '@giveaway/integration-icons/x-icon';

interface UpgradeBenefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const X_PICKER_BENEFITS: UpgradeBenefit[] = [
  {
    icon: Zap,
    title: 'No API Integration Required',
    description:
      'Start picking winners without setting up Twitter API credentials'
  },
  {
    icon: Sparkles,
    title: 'Schedule & Multi-Post Picking',
    description:
      'Schedule draws for future dates and pick across multiple posts'
  },
  {
    icon: Shield,
    title: 'Advanced Filtering',
    description:
      'Filter participants by criteria to ensure fair winner selection'
  }
];

interface XPickerUpgradeContentProps {
  slug: string;
}

export const XPickerUpgradeContent: React.FC<XPickerUpgradeContentProps> = ({
  slug: _slug
}) => {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-primary/10">
          <SocialXIcon className="h-12 w-12 text-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-3xl font-bold">X Picker</h2>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
            <GemIcon className="h-4 w-4" />
            Pro
          </div>
        </div>
        <p className="text-muted-foreground text-lg">
          Upgrade to Pro to access X Picker powered by Twitter 2.0 API
        </p>
      </div>

      <div className="space-y-4 pt-4">
        <div className="grid gap-3 text-left max-w-md mx-auto">
          {X_PICKER_BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.title} className="flex items-start gap-3">
                <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{benefit.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild size="lg">
            <Link href="/home#pricing">
              <GemIcon className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/pickers/x">
              Try for free <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
