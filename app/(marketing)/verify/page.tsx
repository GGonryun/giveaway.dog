import { ComingSoon } from '@/components/patterns/coming-soon';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Email | Giveaway.dog',
  description: 'Verify your email address',
  robots: {
    index: false,
    follow: false
  }
};

export default async function Page() {
  return <ComingSoon />;
}
