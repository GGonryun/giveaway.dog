'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { Bell, Check, Mail } from 'lucide-react';

export function SubscriptionCTA() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubscribed(true);
    setIsLoading(false);
    setEmail('');
  };

  if (isSubscribed) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-center">
              <Typography.Header level={3} className="text-lg font-semibold text-green-900">
                You're all set!
              </Typography.Header>
              <Typography.Paragraph className="text-green-700">
                We'll notify you about the latest giveaways.
              </Typography.Paragraph>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto">
            <Bell className="w-6 h-6 text-primary" />
          </div>

          <div className="space-y-2">
            <Typography.Header level={3} className="text-xl font-semibold">Never Miss a Giveaway!</Typography.Header>
            <Typography.Paragraph className="text-muted-foreground">
              Get notified when new exciting giveaways go live. Join thousands
              of winners!
            </Typography.Paragraph>
          </div>

          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !email}
              className="whitespace-nowrap"
            >
              {isLoading ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>

          <Typography.Paragraph className="text-xs text-muted-foreground">
            No spam, unsubscribe anytime. We respect your privacy.
          </Typography.Paragraph>
        </div>
      </CardContent>
    </Card>
  );
}
