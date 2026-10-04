import { UserSettings } from '@giveaway/account-profile/user-profile';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Account | Giveaway.dog',
  description: 'Manage your account settings',
  robots: {
    index: false,
    follow: false
  }
};

export default async function Page() {
  return <UserSettings />;
}
