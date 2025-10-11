import { UserPage } from '@/components/account/page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Account | Giveaway.dog',
  description: 'Manage your account settings',
  robots: {
    index: false,
    follow: false
  }
};

export default async function Page() {
  return <UserPage />;
}
