import { PublicXPickerForm } from '@/lib/pickers/x/components/public-x-picker-form';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';
import { PickerHowItWorksSection } from '@/lib/pickers/x/components/picker-how-it-works-section';
import { PickerBenefitsSection } from '@/lib/pickers/x/components/picker-benefits-section';
import { PickerFaqSection } from '@/lib/pickers/x/components/picker-faq-section';
import { HostCTA } from '@/components/sweepstakes-browse/components/host-cta';
import { environment } from '@/lib/environment';
import type { Metadata } from 'next';

const appUrl = environment.appUrl();

export const metadata: Metadata = {
  title: 'Free X (Twitter) Giveaway Winner Picker | Random Retweet Selector',
  description:
    'Pick random winners from X retweets instantly. Free giveaway picker tool with advanced filters for followers, account age, and more. Fair, transparent, and instant results.',
  keywords: [
    'x giveaway picker',
    'twitter giveaway picker',
    'x winner picker',
    'twitter winner picker',
    'random retweet picker',
    'x giveaway tool',
    'twitter giveaway tool',
    'free giveaway picker',
    'random winner selector',
    'x contest picker'
  ],
  openGraph: {
    title: 'Free X (Twitter) Giveaway Winner Picker | Giveaway.dog',
    description:
      'Pick random winners from X retweets instantly. Free tool with advanced filters, fair selection, and instant results.',
    type: 'website',
    url: `${appUrl}/pickers/x`,
    siteName: 'Giveaway.dog',
    images: [
      {
        url: `${appUrl}/api/og`,
        width: 1200,
        height: 630,
        alt: 'Giveaway.dog X Picker Tool'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free X (Twitter) Giveaway Winner Picker',
    description:
      'Pick random winners from X retweets instantly. Free tool with advanced filters and instant results.',
    images: [`${appUrl}/api/og`]
  }
};

export default function PublicXPickerPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto mb-8">
        <MarketingPageHeader
          title="X (Twitter) Picker"
          description="Select a winner from users who reposted your giveaway on X."
        />
      </div>

      <div className="max-w-2xl mx-auto mb-12">
        <PublicXPickerForm />
      </div>

      <div className="max-w-2xl mx-auto mb-12">
        <PickerHowItWorksSection />
      </div>

      <div className="max-w-2xl mx-auto mb-12">
        <PickerBenefitsSection />
      </div>

      <div className="max-w-3xl mx-auto mb-12">
        <PickerFaqSection />
      </div>

      <div className="max-w-3xl mx-auto">
        <HostCTA />
      </div>
    </div>
  );
}
