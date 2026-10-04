import { UserSettings } from '@giveaway/account-profile/user-profile';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Profile Settings | Giveaway.dog',
  description: 'Manage your profile settings',
  robots: {
    index: false,
    follow: false
  }
};

export default async function Page() {
  return <UserSettings />;
}
