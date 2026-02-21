'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MousePointerClickIcon, Settings, Sparkles } from 'lucide-react';

interface PickersFeatureDisabledCTAProps {
  slug: string;
}

export const PickersFeatureDisabledCTA: React.FC<
  PickersFeatureDisabledCTAProps
> = ({ slug }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-12 pb-12 px-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10">
                <MousePointerClickIcon className="h-12 w-12 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Pickers Feature</h2>
              <p className="text-muted-foreground text-lg">
                Enable the Pickers feature to select winners from social media
                posts
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="grid gap-3 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Twitter/X Integration</p>
                    <p className="text-sm text-muted-foreground">
                      Select winners from likes, retweets, quotes, and replies
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Advanced Filtering</p>
                    <p className="text-sm text-muted-foreground">
                      Filter by followers, account age, and profile requirements
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Scheduled Draws</p>
                    <p className="text-sm text-muted-foreground">
                      Schedule winner selection for a specific date and time
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button asChild size="lg">
                  <Link href="/demo/pickers">
                    <MousePointerClickIcon className="mr-2 h-4 w-4" />
                    View Demo
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={`/app/${slug}/settings/features`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Enable Feature
                  </Link>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                Enable this feature in your team settings to start using Pickers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
