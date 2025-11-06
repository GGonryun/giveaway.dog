import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  HammerIcon,
  MousePointerClickIcon,
  SparklesIcon,
  UsersIcon
} from 'lucide-react';
import { Typography } from '@/components/ui/typography';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';

export default function ToolsPage() {
  const premiumTools = [
    {
      name: 'Sweepstakes Platform',
      description:
        'Create professional giveaway pickers with advanced fraud detection, task automation, and analytics.',
      icon: SparklesIcon,
      href: '/tools/sweepstakes',
      features: [
        'Advanced fraud detection and bot filtering',
        'Task automation (Twitter, Discord, Steam, etc.)',
        'Real-time analytics and insights',
        'Custom branded picker pages',
        'Automatic winner selection'
      ],
      featured: true
    },
    {
      name: 'Social Pickers',
      description:
        'Manage sweepstakes natively across multiple social platforms including Reddit, Twitter/X, Facebook, and Twitch. Automate entry tracking across all your channels.',
      icon: MousePointerClickIcon,
      href: '/tools/pickers/social',
      features: [
        'Multi-platform support (Reddit, X, Facebook, Twitch)',
        'Auto-sync entries in real-time',
        'Smart duplicate detection',
        'Unified dashboard for all platforms',
        'Bulk CSV import and API integration'
      ]
    }
  ];

  const freeTools = [
    {
      name: 'Name Picker',
      description:
        'Spin the prize wheel to randomly select a winner from a list of names.',
      icon: UsersIcon,
      href: '/tools/pickers/names',
      features: [
        'Interactive spinning prize wheel',
        'Enter unlimited names',
        'Confetti celebration on win',
        'Sound effects for excitement',
        'Instant winner reveal'
      ]
    }
  ];

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="mb-8">
        <MarketingPageHeader
          icon={HammerIcon}
          title="Giveaway Tools"
          description={
            'Professional sweepstakes platform and free tools to help you run fair and transparent giveaways'
          }
        />
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold">Premium Tools</h2>
        <p className="text-muted-foreground mb-8">
          Professional sweepstakes management with advanced fraud detection,
          task automation, and multi-platform sync
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {premiumTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.name}
                className={`flex flex-col ${tool.featured ? 'border-primary/50 shadow-lg' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${tool.featured ? 'bg-primary/20' : 'bg-primary/10'}`}
                    >
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {tool.name}
                        {tool.featured && (
                          <Badge
                            variant="default"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Popular
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-2 mb-6 flex-1">
                    {tool.features.map((feature) => (
                      <li
                        key={feature}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-primary mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full">
                    <Link href={tool.href}>
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="mb-12">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Free Tools</h2>
          <Badge variant="success">Free</Badge>
        </div>
        <p className="text-muted-foreground mb-8">
          Simple, free tools for quick random selections and winner picking
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {freeTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.name} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>{tool.name}</CardTitle>
                    </div>
                  </div>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-2 mb-6 flex-1">
                    {tool.features.map((feature) => (
                      <li
                        key={feature}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-primary mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full" variant="outline">
                    <Link href={tool.href}>
                      Use Tool
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          More tools coming soon! Have a suggestion?{' '}
          <Link href="/support" className="text-primary hover:underline">
            Let us know
          </Link>
        </p>
      </div>
    </div>
  );
}
