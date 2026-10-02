import { ThemeToggle } from '@/components/theme/theme-toggle';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Appearance Settings | Giveaway.dog',
  description: 'Customize your appearance preferences',
  robots: {
    index: false,
    follow: false
  }
};

export default async function Page() {
  return <ThemeToggle />;
}
