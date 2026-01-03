import { environment } from '@/lib/environment';
import { Metadata } from 'next';
import { HomePage } from '@/lib/home/page';
import findUser from '@/procedures/user/find-user';
import { HOST_DASHBOARD_FEATURE_FLAG_KEY } from '@/schemas/feature-flags';
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
  // if the user is logged out redirect to /home
  const user = await findUser({ self: true });

  if (!user.ok || !user.data) {
    return <HomePage />;
  }

  // if user has the host flag enabled redirect to /dashboard
  if (user.data.featureFlags?.includes(HOST_DASHBOARD_FEATURE_FLAG_KEY)) {
    return redirect('/app');
  } else {
    return redirect('/browse');
  }
}
