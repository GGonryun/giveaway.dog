import { PublicXPickerForm } from '@/lib/pickers/x/components/public-x-picker-form';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'X Picker | Giveaway.dog',
  description:
    'Pick a winner for your giveaway from a list of people who reposted on X'
};

export default function PublicXPickerPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="mb-8">
        <MarketingPageHeader
          title="X Picker"
          description="Select a winner from users who reposted your giveaway on X."
        />
      </div>
      <PublicXPickerForm />
    </div>
  );
}
