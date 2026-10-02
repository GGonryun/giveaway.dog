'use server';

import { TeamPageProps } from '@/schemas/pages';
import { SocialsSettings } from '@/lib/settings/components/socials-page';

interface SocialsSettingsPageProps {
  params: Promise<TeamPageProps>;
}

export default async function SocialsSettingsPage({
  params
}: SocialsSettingsPageProps) {
  const { slug } = await params;

  return <SocialsSettings slug={slug} />;
}
