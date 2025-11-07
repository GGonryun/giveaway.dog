import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FeatureCard } from '@/components/marketing/feature-card';
import { HowItWorksSection } from '@/components/marketing/how-it-works-section';
import {
  MousePointerClickIcon,
  ArrowRight,
  Shield,
  Zap,
  Users,
  CheckCircle2,
  Twitter,
  BarChart3
} from 'lucide-react';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';

export default function PickersDemoPage() {
  const features = [
    {
      icon: Twitter,
      title: 'Social Media Integration',
      description:
        'Select winners from Twitter/X likes, retweets, quotes, and replies automatically'
    },
    {
      icon: Shield,
      title: 'Fraud Detection',
      description:
        'Built-in filters for minimum followers, account age, and profile requirements'
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description:
        'Get results in minutes with automated data collection and processing'
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description:
        'View participant stats, eligibility breakdowns, and engagement metrics'
    }
  ];

  const benefits = [
    'Multiple winner selection',
    'Filter by account age, followers, and activity',
    'Profile requirements (avatar, banner, bio, location)',
    'Automated data collection from Twitter/X',
    'Scheduled draws with timezone support',
    'Public result pages with verification',
    'Audit logs for transparency',
    'Export winner data'
  ];

  const howItWorksSteps = [
    {
      title: 'Paste Tweet URL',
      description: 'Enter the URL of your Twitter/X post'
    },
    {
      title: 'Configure Requirements',
      description:
        'Set filters for winners (actions, followers, account age, etc.)'
    },
    {
      title: 'Schedule or Run Now',
      description: 'Choose to run immediately or schedule for a specific time'
    },
    {
      title: 'View & Share Results',
      description: 'Get your winners with a public results page'
    }
  ];

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <div className="mb-8">
          <MarketingPageHeader
            icon={MousePointerClickIcon}
            title="Pickers Demo"
            description="Fairly select winners from social media interactions with advanced filtering and fraud detection"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/tools/pickers/social">Try Free Tool</Link>
          </Button>
        </div>
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
                  <MousePointerClickIcon className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">
                    Ready to Pick Your Winners?
                  </h3>
                  <p className="text-muted-foreground">
                    Join creators using pickers for fair giveaways
                  </p>
                </div>
                <div className="space-y-3">
                  <Button asChild className="w-full" size="lg">
                    <Link href="/login">Create Account</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Link href="/tools/pickers/social">Try Free Tool</Link>
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
        <h2 className="text-3xl font-bold mb-4">Start Picking Winners Today</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
          Create your first picker in minutes. Fair, transparent, and automated.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/login">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href="/pricing">See Plans</Link>
          </Button>
        </div>
      </div>

      <div className="mt-20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold">Looking for More Tools?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Check out our other giveaway tools
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <FeatureCard
            icon={Users}
            title="Sweepstakes Platform"
            description="Full-featured giveaway platform with tasks, analytics, and fraud detection"
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/tools/sweepstakes">
                  Learn More
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
