import { auth } from '@giveaway/auth-server/config';
import getParticipantSweepstake from '@giveaway/participation-server/get-participant-sweepstake';
import { getSweepstakesPrivacy } from '@giveaway/participation-server/get-sweepstakes-privacy';
import { getSweepstakesId } from '@giveaway/participation-server/get-sweepstakes-id';
import { Metadata } from 'next';
import { date } from '@giveaway/util-time/date';
import { html } from '@giveaway/util-html/html';
import { environment } from '@giveaway/app-config/environment';

interface LayoutProps {
  children: React.ReactNode;
  authenticated: React.ReactNode;
  anonymous: React.ReactNode;
  params: Promise<{ id: string }>;
}

const NOT_FOUND_METADATA: Metadata = {
  title: 'Giveaway Not Found | Giveaway.dog'
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sweepstakesId = await getSweepstakesId({ sweepstakesId: id });

  if (!sweepstakesId.ok) {
    return NOT_FOUND_METADATA;
  }

  const options = { sweepstakesId: sweepstakesId.data };
  const [result, privacy] = await Promise.all([
    getParticipantSweepstake(options),
    getSweepstakesPrivacy(options)
  ]);

  if (!result.ok || !privacy.ok || !privacy.data) {
    return NOT_FOUND_METADATA;
  }

  const { sweepstakes, host } = result.data;
  const prizeNames = sweepstakes.prizes.map((p) => p.name).join(', ');
  const endDate = date.format(sweepstakes.timing.endDate);
  const summary = html
    .toPlainText(sweepstakes.setup.description ?? '')
    .substring(0, 100)
    .trimEnd();

  return {
    title: `${sweepstakes.setup.name} | Giveaway by ${host.name}`,
    description: `Enter to win ${prizeNames}! Giveaway ends ${endDate}. ${summary || 'Join now for a chance to win!'}`,
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
      url: `${environment.appUrl()}/browse/${id}`,
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
