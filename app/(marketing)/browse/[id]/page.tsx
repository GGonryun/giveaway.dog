import { SweepstakesParticipationPageContent } from '@/components/sweepstakes-browse/sweepstakes-participation-page-content';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, CircleAlertIcon, ShareIcon } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  try {
    const result = await getParticipantSweepstake({ id });
    if (!result.ok) {
      notFound();
    }

    return (
      <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 p-4 sm:p-6 sm:container sm:max-w-3xl">
        <div className="flex flex-col sm:flex-row gap-2 w-full justify-between">
          <Button asChild className="w-full sm:w-fit self-start">
            <Link href="/browse">
              <ArrowLeftIcon />
              Browse More Giveaways
            </Link>
          </Button>
          <div className="flex flex-row gap-2">
            <Button variant="outline" className="grow sm:grow-0">
              <ShareIcon />
              Share
            </Button>
            <Button variant="destructive">
              <CircleAlertIcon />
              Report
            </Button>
          </div>
        </div>
        <SweepstakesParticipationPageContent {...result.data} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
