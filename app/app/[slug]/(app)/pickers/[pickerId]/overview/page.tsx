'use server';

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import { PickerOverview } from '@/lib/pickers/components/picker-overview';
import { getUnvalidatedPickerForm } from '@/lib/pickers/procedures/get-unvalidated-picker-form';
import { getPublicPicker } from '@/lib/pickers/procedures/get-public-picker';
import { getTeamIntegrations } from '@/lib/integrations/procedures/get-team-integrations';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Picker Overview | Giveaway.dog',
    description: 'View your picker status and details',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface PickerOverviewPageProps {
  params: Promise<{ slug: string; pickerId: string }>;
}

export default async function Page({ params }: PickerOverviewPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <Wrapper params={params} />
    </Suspense>
  );
}

const Wrapper: React.FC<{
  params: Promise<{ slug: string; pickerId: string }>;
}> = async ({ params }) => {
  const { pickerId, slug } = await params;

  const picker = await getPublicPicker({ pickerId });
  if (!picker.ok) {
    return <div>Failed to load picker: {picker.data.message}</div>;
  }

  const integrations = await getTeamIntegrations({ slug });
  if (!integrations.ok) {
    return <div>Failed to load integrations: {integrations.data.message}</div>;
  }

  return (
    <PickerOverview
      picker={picker.data}
      teamSlug={slug}
      integrations={integrations.data}
    />
  );
};
