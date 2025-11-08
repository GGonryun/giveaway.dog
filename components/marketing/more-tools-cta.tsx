import { Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import Link from 'next/link';

export const MorePowerfulGiveawaysCTA: React.FC = () => {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent>
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-shrink-0">
            <div className="p-4 bg-primary/20 rounded-2xl">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2">
              Need More Powerful Giveaways?
            </h3>
            <p className="text-muted-foreground mb-4">
              Create complete giveaway campaigns with task tracking, fraud
              detection, and advanced analytics. Perfect for growing your
              audience and engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Button asChild>
                <Link href="/demo/sweepstakes">
                  Get Started - Free
                  <ArrowRight className="mb-0.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/browse">Browse Examples</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MoreToolsCTA: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <p className="text-sm text-muted-foreground mb-3">
        Looking for more tools?
      </p>
      <Button asChild variant="outline">
        <Link href="/tools">
          View All Tools
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
};
