'use server';

import { TemplatesPage } from '@giveaway/templates-gallery/templates-page';
import { getTemplates } from '@giveaway/templates-server/get-templates';
import { TeamPageProps } from '@giveaway/sweepstakes-model/pages';

export default async function Page({
  params
}: {
  params: Promise<TeamPageProps>;
}) {
  const { slug } = await params;
  const templates = await getTemplates({ slug });

  if (!templates.ok) {
    return <div>Failed to load templates: {templates.data.message}</div>;
  }

  return <TemplatesPage slug={slug} templates={templates.data} />;
}
