'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GemIcon, Sparkles, Zap, Shield } from 'lucide-react';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';

interface XPickersUpgradeCTAProps {
  slug: string;
}

export const XPickersUpgradeCTA: React.FC<XPickersUpgradeCTAProps> = ({
  slug
}) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-12 pb-12 px-8">
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
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">No API Integration Required</p>
                    <p className="text-sm text-muted-foreground">
                      Start picking winners without setting up Twitter API
                      credentials
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Simplified Workflow</p>
                    <p className="text-sm text-muted-foreground">
                      Modern interface designed for speed and ease of use
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Advanced Filtering</p>
                    <p className="text-sm text-muted-foreground">
                      Filter participants by criteria to ensure fair winner
                      selection
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button asChild size="lg">
                  <Link href="/home#pricing">
                    <GemIcon className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={`/app/${slug}/pickers/twitter`}>
                    View Legacy Pickers
                  </Link>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                Legacy Twitter pickers are still available on the free tier
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
