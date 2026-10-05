'use server';

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { TeamPageProps } from '@giveaway/sweepstakes-model/pages';
import { TeamRoles } from '@giveaway/team-members-ui/team-roles';
import getTeamMembers from '@giveaway/team-members-server/get-team-members';
import getTeamInvitations from '@giveaway/team-invites-server/get-team-invitations';
import getInviteLink from '@giveaway/team-invites-server/get-invite-link';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Team Settings | Giveaway.dog',
    description: 'Manage your team members and invitations',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface PageProps {
  params: Promise<TeamPageProps>;
}

export default async function Page({ params }: PageProps) {
  return (
    <Suspense fallback={<div>Loading team settings...</div>}>
      <Wrapper params={params} />
    </Suspense>
  );
}

const Wrapper: React.FC<{
  params: Promise<TeamPageProps>;
}> = async ({ params }) => {
  const { slug } = await params;

  const [membersResult, invitationsResult, inviteLinkResult] =
    await Promise.all([
      getTeamMembers({ slug }),
      getTeamInvitations({ slug }),
      getInviteLink({ slug })
    ]);

  if (!membersResult.ok || !invitationsResult.ok || !inviteLinkResult.ok) {
    redirect(`/app/${slug}`);
  }

  return (
    <TeamRoles
      slug={slug}
      initialMembers={membersResult.data}
      initialInvitations={invitationsResult.data}
      initialInviteUrl={inviteLinkResult.data.url}
      initialInviteCode={inviteLinkResult.data.code}
    />
  );
};
