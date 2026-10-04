import { environment } from '@giveaway/app-config/environment';
import { Metadata } from 'next';
import { HomePage } from '@/lib/home/page';
import { auth } from '@/lib/auth/config';
import { UserAccountType } from '@prisma/client';
import { redirect } from 'next/navigation';

const appUrl = environment.appUrl();

export const metadata: Metadata = {
  title: 'Giveaway.dog - Create and Host Viral Giveaways & Contests',
  description:
    'The easiest way to create, manage, and host giveaways and contests. Grow your audience with viral social media giveaways, raffles, and sweepstakes. Start free today!',
  keywords: [
    'giveaway',
    'contest',
    'raffle',
    'sweepstakes',
    'social media giveaway',
    'viral marketing',
    'audience growth',
    'free giveaway tool'
  ],
  openGraph: {
    title: 'Giveaway.dog - Create and Host Viral Giveaways & Contests',
    description:
      'The easiest way to create, manage, and host giveaways and contests. Grow your audience with viral social media giveaways.',
    type: 'website',
    url: 'https://giveaway.dog',
    siteName: 'Giveaway.dog',
    images: [
      {
        url: `${appUrl}/api/og`,
        width: 1200,
        height: 630,
        alt: 'Giveaway.dog'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Giveaway.dog - Create and Host Viral Giveaways & Contests',
    description:
      'The easiest way to create, manage, and host giveaways and contests. Grow your audience with viral social media giveaways.',
    images: [`${appUrl}/api/og`]
  }
};

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    return <HomePage />;
  }

  // if user has host account type redirect to /dashboard
  if (session.user.accountType === UserAccountType.HOST) {
    return redirect('/app');
  } else {
    return redirect('/browse');
  }
}
