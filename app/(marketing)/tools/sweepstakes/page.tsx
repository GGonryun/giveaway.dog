import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SweepstakesPreview } from '@/components/sweepstakes-browse/sweepstakes-preview';
import { FeatureCard } from '@/components/marketing/feature-card';
import { HowItWorksSection } from '@/components/marketing/how-it-works-section';
import {
  Trophy,
  ArrowRight,
  Shield,
  BarChart3,
  Users,
  Zap,
  CheckCircle2,
  Play,
  Sparkles
} from 'lucide-react';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';

export default function SweepstakesToolPage() {
  const features = [
    {
      icon: Shield,
      title: 'Fraud Detection',
      description:
        'Advanced bot detection and quality scoring to ensure fair giveaways'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description:
        'Track entries, engagement, and user behavior with detailed insights'
    },
    {
      icon: Users,
      title: 'Audience Growth',
      description: 'Designed to maximize engagement and grow your community'
    },
    {
      icon: Zap,
      title: 'Task Automation',
      description:
        'Auto-verify social tasks like follows, reposts, and Discord joins'
    }
  ];

  const benefits = [
    'Unlimited giveaways and entries',
    'Custom task requirements (Twitter, Discord, Steam, etc.)',
    'Automatic winner selection with quality filters',
    'Age verification and regional restrictions',
    'Branded picker pages',
    'Detailed participant analytics',
    'Export winner data',
    'Public or private pickers'
  ];

  const howItWorksSteps = [
    {
      title: 'Create Picker',
      description: 'Set up your giveaway with custom tasks and requirements'
    },
    {
      title: 'Share & Promote',
      description: 'Get a branded picker page to share with your audience'
    },
    {
      title: 'Track Entries',
      description: 'Monitor participants in real-time with fraud detection'
    },
    {
      title: 'Pick Winners',
      description: 'Select winners fairly with automatic verification'
    }
  ];

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <div className="mb-8">
          <MarketingPageHeader
            icon={Sparkles}
            title="Sweepstakes Platform"
            description="Create professional giveaway pickers with advanced fraud detection, task automation, and real-time analytics"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/demo/sweepstakes">
              <Play className="mr-2 h-5 w-5" />
              Try Interactive Demo
            </Link>
          </Button>
          <Button asChild variant="outline" className="px-8">
            <Link href="/pricing">
              View Pricing <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-20">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">See It In Action</h2>
          <p className="text-muted-foreground">
            Preview a live giveaway picker below
          </p>
        </div>
        <Card className="overflow-hidden border-2 py-4 p-0 m-0 gap-0">
          <CardContent className="p-0 m-0">
            <Suspense
              fallback={
                <div className="p-8 text-center text-muted-foreground">
                  Loading preview...
                </div>
              }
            >
              <SweepstakesPreview />
            </Suspense>
          </CardContent>
          <div className="border-t p-4 m-0 bg-muted/30 text-center">
            <Button asChild variant="link">
              <Link href="/demo/sweepstakes" className="text-primary">
                Try Interactive Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      <div className="mb-20">
        <HowItWorksSection title="How It Works" steps={howItWorksSteps} />
      </div>

      <div className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-6 sm:mb-8">
          Powerful Features
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>

      <div className="mb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Everything You Need</h2>
            <div className="space-y-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/login">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div>
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6 pb-6">
                <div className="text-center mb-6">
                  <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">
                    Ready to Launch Your First Giveaway?
                  </h3>
                  <p className="text-muted-foreground">
                    Join thousands of creators running successful pickers
                  </p>
                </div>
                <div className="space-y-3">
                  <Button asChild className="w-full" size="lg">
                    <Link href="/demo/sweepstakes">
                      <Play className="mr-2 h-4 w-4" />
                      Try Demo
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Link href="/browse">Browse Examples</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 text-center shadow-md border-1 border-primary/20">
        <h2 className="text-3xl font-bold mb-4">Start Growing Your Audience</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
          Create your first professional giveaway picker in minutes. No credit
          card required for the demo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/demo/sweepstakes">
              <Play className="mr-2 h-5 w-5" />
              Try Demo Now
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href="/pricing">See Plans</Link>
          </Button>
        </div>
      </div>

      <div className="mt-20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold">Looking for Simpler Tools?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Try our free tools for quick and easy giveaways
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <FeatureCard
            icon={Trophy}
            title="Twitter Picker"
            description="Select winners from likes, reposts, quotes, and replies"
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/tools/picker/x">
                  Try Tool
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            }
          />
          <FeatureCard
            icon={Users}
            title="Name Picker"
            description="Spin the prize wheel to randomly select a winner from names"
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/tools/pickers/names">
                  Try Tool
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            }
          />
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/tools">
              View All Free Tools
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
