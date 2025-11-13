'use server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Zap, Edit, Shield, DollarSign } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Launch Giveaways in Minutes',
    description:
      'Start faster with plug-and-play templates that let you go live in seconds. Connect your favorite platforms, set entry rules, and launch a verified giveaway without any setup headaches.'
  },
  {
    icon: Edit,
    title: 'Edit Everything, Instantly',
    description:
      'Fine-tune your giveaway design, entry methods, and pickers with our intuitive visual editor. Make changes on the fly and keep campaigns running smoothly without any coding or technical expertise.'
  },
  {
    icon: Shield,
    title: 'No Bots. No Spam. Just Real Fans.',
    description:
      'Our automated fraud detection ensures only real humans can enter your giveaways. Protect your audience, maintain fair play, and grow your community with verified engagement.'
  },
  {
    icon: DollarSign,
    title: 'Fair Pricing & Full Ownership',
    description:
      'Pay only when you run a giveaway — no monthly subscriptions or hidden fees. Keep full control of your data, collect audience insights, and export results anytime.'
  }
];

export const FeaturesSection = async () => {
  return (
    <section className="w-full flex items-center justify-center bg-secondary/30">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <Typography.Header
            level={2}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
          >
            Why Creators Choose Us
          </Typography.Header>
          <Typography.Paragraph className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Host a verified giveaway in 60 seconds — no bots, no spam.
          </Typography.Paragraph>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Typography.Paragraph className="text-muted-foreground">
                    {feature.description}
                  </Typography.Paragraph>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
