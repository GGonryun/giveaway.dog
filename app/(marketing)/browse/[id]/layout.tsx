import { auth } from '@/lib/auth/config';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import { Metadata } from 'next';
import { date } from '@/lib/date';

interface LayoutProps {
  children: React.ReactNode;
  authenticated: React.ReactNode;
  anonymous: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getParticipantSweepstake({ sweepstakesId: id });

  if (!result.ok) {
    return {
      title: 'Giveaway Not Found | Giveaway.dog'
    };
  }

  const { sweepstakes, host } = result.data;
  const prizeNames = sweepstakes.prizes.map((p) => p.name).join(', ');
  const endDate = date.format(sweepstakes.timing.endDate);

  return {
    title: `${sweepstakes.setup.name} | Giveaway by ${host.name}`,
    description: `Enter to win ${prizeNames}! Giveaway ends ${endDate}. ${sweepstakes.setup.description?.substring(0, 100) || 'Join now for a chance to win!'}`,
    keywords: [
      'giveaway',
      'contest',
      'win',
      sweepstakes.setup.name,
      ...sweepstakes.prizes.map((p) => p.name)
    ],
    openGraph: {
      title: `${sweepstakes.setup.name} | ${host.name}`,
      description: `Enter to win ${prizeNames}! Ends ${endDate}.`,
      type: 'website',
      url: `https://giveaway.dog/browse/${id}`,
      images: [
        {
          url: sweepstakes.setup.banner,
          width: 1920,
          height: 1080,
          alt: sweepstakes.setup.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${sweepstakes.setup.name} | ${host.name}`,
      description: `Enter to win ${prizeNames}! Ends ${endDate}.`,
      images: [sweepstakes.setup.banner]
    }
  };
}

export default async function BrowseLayout({
  authenticated,
  anonymous
}: LayoutProps) {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return <>{isAuthenticated ? authenticated : anonymous}</>;
}
