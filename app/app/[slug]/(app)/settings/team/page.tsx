'use server';

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { TeamPageProps } from '@/schemas/pages';
import { TeamRoles } from '@/lib/settings/components/team-roles';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Team Profile | Giveaway.dog',
    description: 'View your team profile settings and details',
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
    <Suspense fallback={<div>Loading profile page...</div>}>
      <Wrapper params={params} />
    </Suspense>
  );
}

const Wrapper: React.FC<{
  params: Promise<TeamPageProps>;
}> = async ({ params }) => {
  const { slug } = await params;
  return <TeamRoles slug={slug} />;
};
