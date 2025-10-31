import {
  Trophy,
  Shield,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Users,
  MousePointerClickIcon,
  Layers,
  Clock,
  Link2,
  MessageSquare,
  Share2,
  Globe,
  Video
} from 'lucide-react';
import { FeatureCard } from '@/components/marketing/feature-card';
import { HowItWorksSection } from '@/components/marketing/how-it-works-section';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MoreToolsCTA } from '@/components/marketing/more-tools-cta';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Typography } from '@/components/ui/typography';

const FEATURES = [
  {
    icon: Layers,
    title: 'Unified Sweepstakes Platform',
    description:
      'Import external entries into GiveawayDog to run realistic draws with our fraud detection, analytics, and fair winner selection.'
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Sync to Your Pickers',
    description:
      'Automatically import participants from external platforms into your GiveawayDog sweepstakes. All entries unified in one place for transparent draws.'
  },
  {
    icon: Shield,
    title: 'Official API Integration',
    description:
      'We use official platform APIs with proper OAuth. No scrapers, no hacks, no ToS violations. Fully compliant and legal import methods.'
  },
  {
    icon: Trophy,
    title: 'Professional Winner Selection',
    description:
      "Use GiveawayDog's proven random selection algorithms, fraud detection, and provably fair draws for your imported entries."
  },
  {
    icon: BarChart3,
    title: 'Cross-Platform Analytics',
    description:
      'View comprehensive analytics across all platforms. Track engagement, detect duplicates, and optimize your multi-platform pickers.'
  },
  {
    icon: Users,
    title: 'Smart Duplicate Detection',
    description:
      'Automatically merge duplicate participants across platforms. Ensure each person is counted only once for fair, realistic sweepstakes.'
  }
];

const PLATFORMS = [
  {
    icon: MessageSquare,
    title: 'Reddit',
    description:
      'Import entries from subreddit posts, comments, and upvotes. Perfect for community-driven giveaways.'
  },
  {
    icon: Share2,
    title: 'Twitter/X',
    description:
      'Sync likes, retweets, replies, and follows from your Twitter/X sweepstakes posts.'
  },
  {
    icon: Globe,
    title: 'Facebook',
    description:
      'Import entries from Facebook posts, comments, shares, and reactions on your pages.'
  },
  {
    icon: Video,
    title: 'Twitch',
    description:
      'Track Twitch channel follows, chat participation, and subscriber giveaway entries.'
  }
];

const BENEFITS = [
  {
    icon: Clock,
    title: 'Save Hours',
    description: 'Automate manual entry tracking'
  },
  {
    icon: Link2,
    title: 'Connect Anywhere',
    description: 'Import from any social platform'
  },
  {
    icon: Layers,
    title: 'Stay Organized',
    description: 'All entries in one place'
  },
  {
    icon: BarChart3,
    title: 'Better Insights',
    description: 'Cross-platform analytics'
  }
];

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Connect Platforms',
    description: 'Link your Reddit, Twitter, Facebook, or Twitch accounts'
  },
  {
    title: 'Configure Rules',
    description: 'Set entry requirements and validation rules'
  },
  {
    title: 'Auto Import',
    description: 'Entries sync automatically in real-time'
  },
  {
    title: 'Run Fair Draws',
    description: "Use GiveawayDog's transparent selection on unified entries"
  }
];

export default function SocialMediaSyncPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Social Pickers',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Import and sync sweepstakes entries from multiple social media platforms including Reddit, Twitter, Facebook, and Twitch.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    featureList: [
      'Multi-platform import',
      'Real-time synchronization',
      'Duplicate detection',
      'Bulk CSV import',
      'API integration',
      'Entry validation'
    ]
  };

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-3">
          <MousePointerClickIcon className="h-10 w-10 text-primary" />
          <Typography.Header
            level={1}
            className="text-4xl font-bold lg:text-6xl"
          >
            Social Pickers
          </Typography.Header>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
          Import entries from Reddit, Twitter/X, Facebook, Twitch into
          GiveawayDog&apos;s unified platform. Run realistic sweepstakes with
          fraud detection, analytics, and transparent winner selection.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/signup">Start Syncing Free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#platforms">View Platforms</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-20">
        {BENEFITS.map((benefit) => (
          <Card key={benefit.title}>
            <CardContent className="text-center py-2">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-3">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div id="platforms" className="mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Import from Your Favorite Platforms
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Run sweepstakes on external platforms and import entries into
            GiveawayDog for professional draws with fraud detection and
            analytics.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {PLATFORMS.map((platform) => (
            <FeatureCard
              key={platform.title}
              icon={platform.icon}
              title={platform.title}
              description={platform.description}
            />
          ))}
        </div>
      </div>

      <div className="mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Why Competitors Fall Short
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Most sweepstakes tools use unreliable scrapers or violate platform
            ToS. GiveawayDog does it right with official APIs and compliant
            integration.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Other Tools</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">✗</span>
                      <span>
                        Use web scrapers that break when platforms update
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">✗</span>
                      <span>
                        Violate Terms of Service, risking account bans
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">✗</span>
                      <span>Legally questionable for commercial use</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">✗</span>
                      <span>Fragile integrations that frequently fail</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">✗</span>
                      <span>No fraud detection or duplicate prevention</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">✗</span>
                      <span>Basic winner selection without verification</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    GiveawayDog Social Pickers
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>
                        Official OAuth APIs - fully compliant and stable
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>100% Terms of Service compliant integrations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Safe for commercial and business use</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>
                        Reliable, maintained by official platform SDKs
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Advanced fraud detection and bot filtering</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Provably fair draws with full transparency</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Powerful Features for Realistic Draws
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Import entries from anywhere and run professional sweepstakes on
            GiveawayDog&apos;s unified platform with built-in fraud detection
            and transparency.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>

      <div className="mt-20">
        <HowItWorksSection
          title="How Social Pickers Works"
          steps={HOW_IT_WORKS_STEPS}
        />
      </div>

      <div className="mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                What platforms does Social Pickers support?
              </AccordionTrigger>
              <AccordionContent>
                We currently support Reddit, Twitter/X, Facebook, Twitch, and
                Discord. We&apos;re constantly adding new platforms based on
                user demand. You can also import entries manually via CSV upload
                from any platform.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                How does the auto-sync work?
              </AccordionTrigger>
              <AccordionContent>
                Once you connect your accounts, our system monitors your
                sweepstakes posts for new interactions (comments, likes, shares,
                etc.) and automatically imports them as entries in real-time.
                You can also trigger manual syncs anytime.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Can I run the same giveaway across multiple platforms?
              </AccordionTrigger>
              <AccordionContent>
                Yes! That&apos;s exactly what Social Pickers is designed for.
                You can run a giveaway on Reddit, Twitter, and Facebook
                simultaneously, and all entries will be imported into one
                unified picker. Duplicate detection ensures each person is only
                counted once.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                How does duplicate detection work?
              </AccordionTrigger>
              <AccordionContent>
                Our system uses email addresses, usernames, and other unique
                identifiers to detect when the same person enters from multiple
                platforms. You can configure how duplicates are handled - count
                as one entry or multiple entries.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                Can I import entries manually?
              </AccordionTrigger>
              <AccordionContent>
                Yes! You can upload a CSV file with participant information, or
                manually add entries one by one. This is useful for platforms we
                don&apos;t yet support or for offline entries.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left">
                Is there a limit to how many entries I can import?
              </AccordionTrigger>
              <AccordionContent>
                Free accounts can import up to 1,000 entries per picker. Paid
                plans offer unlimited imports. Large bulk imports (10,000+
                entries) are processed in the background.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left">
                Do I need to give permission to my social accounts?
              </AccordionTrigger>
              <AccordionContent>
                Yes, you&apos;ll need to authorize read-only access to the
                platforms you want to sync from. We only request the minimum
                permissions needed to fetch entry data. We never post on your
                behalf or access private messages.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger className="text-left">
                Can I use this for existing giveaways?
              </AccordionTrigger>
              <AccordionContent>
                Absolutely! You can import historical entries from posts
                you&apos;ve already published. Just provide the post URL and
                we&apos;ll fetch all past interactions up to the platform&apos;s
                API limits (usually 30-90 days back).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9">
              <AccordionTrigger className="text-left">
                What happens if a platform&apos;s API goes down?
              </AccordionTrigger>
              <AccordionContent>
                We automatically retry failed syncs and notify you if
                there&apos;s an issue. You can always export your current
                entries and manually add any that were missed during the outage.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <div className="mt-20 text-center">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <RefreshCw className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">
              Ready to Sync Your Sweepstakes?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Import external entries into GiveawayDog&apos;s unified platform.
              Run professional, transparent sweepstakes with built-in fraud
              protection.
            </p>
            <Button size="lg" asChild>
              <Link href="/signup">Connect Your First Platform</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-16">
        <MoreToolsCTA />
      </div>
    </div>
  );
}
