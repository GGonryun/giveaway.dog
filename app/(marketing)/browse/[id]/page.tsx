import { SweepstakesParticipationPageContent } from '@/components/sweepstakes-browse/sweepstakes-participation-page-content';
import getGiveawayParticipation from '@/procedures/browse/get-giveaway-participation';
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
    const result = await getGiveawayParticipation({ id });

    if (!result.ok) {
      notFound();
    }

    return (
      <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 p-4 sm:p-6 sm:container sm:max-w-3xl">
        <Button asChild className="w-full sm:w-fit self-start">
          <Link href="/browse">
            <ArrowLeftIcon />
            Browse More Giveaways
          </Link>
        </Button>
        <SweepstakesParticipationPageContent data={result.data} />
        <div className="flex flex-col sm:flex-row gap-2 w-full justify-end">
          <Button variant="outline">
            <ShareIcon />
            Share
          </Button>
          <Button variant="destructive">
            <CircleAlertIcon />
            Report
          </Button>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
