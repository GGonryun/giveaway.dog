import { Suspense } from 'react';
import { InviteAcceptance } from './invite-acceptance';
import getInviteDetails from '@/procedures/teams/get-invite-details';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { code } = await params;

  const result = await getInviteDetails({ code });

  if (!result.ok) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/0 to-primary/10">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <Suspense
          fallback={
            <div className="w-full max-w-md animate-pulse">
              <div className="h-64 rounded-xl bg-gray-200" />
            </div>
          }
        >
          <InviteAcceptance code={code} inviteDetails={result.data} />
        </Suspense>
      </div>
    </div>
  );
}
