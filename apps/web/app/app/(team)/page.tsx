import { EmojiLogo } from '@giveaway/ui-brand/emoji-logo';
import { TeamPickerForm } from '@/components/team/team-picker-form';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import getUserTeams from '@giveaway/team-server/get-user-teams';
import { getLastTeamSlugFromServerCookies } from '@giveaway/team-model/team/cookies';

export const metadata: Metadata = {
  title: 'Dashboard | Giveaway.dog',
  description: 'Manage your teams and giveaways',
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = 'force-dynamic';

export default async function TeamPickerPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const resolvedParams = await searchParams;

  if (!resolvedParams.step) {
    const cookieStore = await cookies();
    const lastSlug = getLastTeamSlugFromServerCookies(cookieStore);

    if (lastSlug) {
      const teams = await getUserTeams();
      if (teams.ok && teams.data.some((t) => t.slug === lastSlug)) {
        redirect(`/app/${lastSlug}`);
      }
    }
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a
          href="/home"
          className="flex flex-col items-center gap-0 self-center font-medium "
        >
          <EmojiLogo />
        </a>
        <Suspense>
          <TeamPickerForm />
        </Suspense>
      </div>
    </div>
  );
}
