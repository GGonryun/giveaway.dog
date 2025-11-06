import { Trophy } from 'lucide-react';
import {
  Zap,
  Shield,
  FileText,
  MousePointer,
  CheckCircle2,
  Users,
  Sparkles
} from 'lucide-react';
import { FeatureCard } from '@/components/marketing/feature-card';
import { HowItWorksSection } from '@/components/marketing/how-it-works-section';
import { NamePickerClient } from '@/components/picker/name-picker-client';
import {
  MorePowerfulGiveawaysCTA,
  MoreToolsCTA
} from '@/components/marketing/more-tools-cta';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { auth } from '@/lib/auth';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';

const FEATURES = [
  {
    icon: Zap,
    title: 'Fast & Simple',
    description:
      'Pick a random winner in seconds. No registration required, just enter names and spin!'
  },
  {
    icon: Shield,
    title: 'Fair Selection',
    description:
      'Our algorithm ensures every name has an equal chance of being selected randomly.'
  },
  {
    icon: MousePointer,
    title: 'Interactive Wheel',
    description:
      'Engaging spinning wheel animation makes the selection exciting and fun to watch.'
  },
  {
    icon: FileText,
    title: 'No Limits',
    description:
      'Add as many names as you need. Perfect for small groups or large contests.'
  },
  {
    icon: Users,
    title: 'Multiple Uses',
    description:
      'Great for raffles, classroom activities, team selection, and more.'
  },
  {
    icon: CheckCircle2,
    title: '100% Free',
    description:
      'Completely free to use with no hidden costs or registration required.'
  }
];

const USE_CASES = [
  {
    icon: Trophy,
    title: 'For Giveaways',
    description:
      'Run fair contests and giveaways where everyone has an equal chance to win. Build trust with your audience through transparent selection.'
  },
  {
    icon: Users,
    title: 'For Teams',
    description:
      'Randomly assign tasks, pick team leaders, or select presenters. Make group decisions fair and unbiased.'
  },
  {
    icon: Sparkles,
    title: 'For Events',
    description:
      'Add excitement to your events with live winner announcements. The spinning wheel builds anticipation and engagement.'
  },
  {
    icon: FileText,
    title: 'For Classrooms',
    description:
      'Teachers can use it to randomly select students for activities, presentations, or answering questions fairly.'
  }
];

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Enter Names',
    description: 'Type or paste names into the text box, one per line'
  },
  {
    title: 'Load to Wheel',
    description: 'Click "Load Names" to add them to the spinning wheel'
  },
  {
    title: 'Spin & Win',
    description: 'Hit "Spin!" and watch the wheel select a random winner'
  }
];

export default async function NamePickerPage() {
  const session = await auth();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Random Name Picker',
    description:
      'Free random name picker with spinning wheel animation. Pick random winners fairly for giveaways, raffles, classroom activities, and team selection.',
    applicationCategory: 'UtilityApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    featureList: [
      'Interactive spinning wheel',
      'Fair random selection',
      'No registration required',
      'Unlimited names',
      'Confetti celebration',
      'Mobile responsive'
    ]
  };

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mb-8">
        <MarketingPageHeader
          icon={Users}
          title="Name Picker"
          description="Spin the wheel to pick a random winner, perfect for giveaways, raffles, and team selection."
        />
      </div>

      <NamePickerClient isAuthenticated={!!session} />

      <div className="mt-20">
        <HowItWorksSection title="How It Works" steps={HOW_IT_WORKS_STEPS} />
      </div>

      <div className="mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Features</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our free random name picker makes it easy to select winners fairly
            and transparently.
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
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Why Use a Random Name Picker?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Random name selection removes bias and ensures fairness in any
            selection process. Perfect for giveaways, raffles, team assignments,
            and more.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {USE_CASES.map((useCase) => (
            <FeatureCard
              key={useCase.title}
              icon={useCase.icon}
              title={useCase.title}
              description={useCase.description}
            />
          ))}
        </div>
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
                Is the random name picker really random?
              </AccordionTrigger>
              <AccordionContent>
                Yes! Our name picker uses a cryptographically secure random
                number generator to ensure every name has an equal probability
                of being selected. The selection is completely unbiased and
                fair.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                Do I need to create an account to use the name picker?
              </AccordionTrigger>
              <AccordionContent>
                No! The name picker is completely free and requires no
                registration. Simply visit the page, enter your names, and start
                picking winners immediately.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                How many names can I add to the picker?
              </AccordionTrigger>
              <AccordionContent>
                You can add as many names as you need! Whether you have 5 names
                or 500, our picker can handle it. Just enter one name per line
                in the text area.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                Can I pick multiple winners at once?
              </AccordionTrigger>
              <AccordionContent>
                Currently, the wheel picks one winner at a time. After selecting
                a winner, you can click the reset button to spin again and pick
                additional winners from your list.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                Is my data saved or stored anywhere?
              </AccordionTrigger>
              <AccordionContent>
                No, all names are processed locally in your browser. We do not
                store, save, or transmit your names to any server. Your data
                remains completely private.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left">
                Can I use this for commercial giveaways?
              </AccordionTrigger>
              <AccordionContent>
                Absolutely! Our name picker is perfect for both personal and
                commercial use. Whether you&apos;re running a business giveaway,
                social media contest, or any other promotion, feel free to use
                our tool.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left">
                What makes this better than other name pickers?
              </AccordionTrigger>
              <AccordionContent>
                Our name picker combines an engaging visual wheel animation with
                a truly random selection algorithm. It&apos;s fast, free,
                requires no registration, and works perfectly on all devices.
                Plus, it includes fun confetti animations for celebrations!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger className="text-left">
                Can I share the results with others?
              </AccordionTrigger>
              <AccordionContent>
                Yes! You can easily screenshot the winner announcement to share
                on social media or with your participants. The winner is
                displayed prominently with a celebration animation.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9">
              <AccordionTrigger className="text-left">
                Does it work on mobile devices?
              </AccordionTrigger>
              <AccordionContent>
                Yes! The name picker is fully responsive and works great on
                smartphones, tablets, and desktop computers. The wheel animation
                and interface adapt to any screen size.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <div className="mt-16">
        <MorePowerfulGiveawaysCTA />
      </div>

      <div className="mt-16">
        <MoreToolsCTA />
      </div>
    </div>
  );
}
