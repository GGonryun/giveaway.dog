import { FeatureSettings } from '@giveaway/account-settings/feature-settings';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Feature Settings | Giveaway.dog',
  description: 'Manage your feature preferences',
  robots: {
    index: false,
    follow: false
  }
};

export default async function Page() {
  return <FeatureSettings />;
}
