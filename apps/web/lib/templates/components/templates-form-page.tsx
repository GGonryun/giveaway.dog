'use server';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { TemplatePageProps } from '@/schemas/pages';
import { getTeamIntegrations } from '@/lib/integrations/procedures/get-team-integrations';
import { getTemplateForm } from '../procedures/get-template-form';
import { TemplateForm } from './template-form';

export const TemplateFormPage = async ({
  params
}: {
  params: Promise<TemplatePageProps>;
}) => {
  const awaited = await params;

  const [form, integrations] = await Promise.all([
    getTemplateForm(awaited),
    getTeamIntegrations(awaited)
  ]);

  if (!form.ok) {
    if (form.data.code === 'NOT_FOUND') notFound();
    return <div>Failed to load template form: {form.data.message}</div>;
  }

  if (!integrations.ok) {
    return <div>Failed to load integrations: {integrations.data.message}</div>;
  }

  return (
    <Suspense>
      {/* 
      WARNING: It would be nice to remove the explicit type assertion here but we want to allow
      users to save drafts with potentially incomplete or broken data, this allows the
      form to properly render errors when they come back to edit or make changes
       */}
      <TemplateForm template={form.data} integrations={integrations.data} />
    </Suspense>
  );
};
