import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Sparkles, Users, Trophy, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const HostCTA: React.FC<{ minimal?: boolean }> = ({ minimal }) => {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-8 md:p-12 text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-3 rounded-full">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <Typography.Header
            level={2}
            className="text-2xl md:text-3xl font-bold tracking-tight"
          >
            Ready to Host Your Own Giveaway?
          </Typography.Header>
          <Typography.Paragraph className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of creators and brands who trust our platform to
            engage their audience and grow their community through exciting
            giveaways.
          </Typography.Paragraph>
        </div>

        {!minimal && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <div className="bg-primary/10 p-2 rounded-full w-fit mx-auto">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Typography.Header level={3} className="font-semibold">
                  Grow Your Audience
                </Typography.Header>
                <Typography.Paragraph className="text-sm text-muted-foreground">
                  Reach new customers and engage existing ones
                </Typography.Paragraph>
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="bg-primary/10 p-2 rounded-full w-fit mx-auto">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Typography.Header level={3} className="font-semibold">
                  Easy Setup
                </Typography.Header>
                <Typography.Paragraph className="text-sm text-muted-foreground">
                  Launch giveaways in minutes, not hours
                </Typography.Paragraph>
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="bg-primary/10 p-2 rounded-full w-fit mx-auto">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Typography.Header level={3} className="font-semibold">
                  Track Results
                </Typography.Header>
                <Typography.Paragraph className="text-sm text-muted-foreground">
                  Monitor engagement and measure success
                </Typography.Paragraph>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/app">Start Your Giveaway</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/demo">
              Try The Demo <ArrowRight />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
