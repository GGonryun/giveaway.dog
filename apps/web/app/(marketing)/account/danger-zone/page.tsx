import { DangerZone } from '@/components/account/danger-zone';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Danger Zone | Giveaway.dog',
  description: 'Account deletion and dangerous actions',
  robots: {
    index: false,
    follow: false
  }
};

export default async function Page() {
  return <DangerZone />;
}
