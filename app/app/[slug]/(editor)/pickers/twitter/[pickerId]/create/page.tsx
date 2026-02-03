import { PickerForm } from '@/lib/pickers/components/picker-form';
import { getTeamIntegrations } from '@/lib/integrations/procedures/get-team-integrations';
import type { Metadata } from 'next';
import { getUnvalidatedPickerForm } from '@/lib/pickers/procedures/get-unvalidated-picker-form';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Create Picker | Giveaway.dog',
    description: 'Create a new picker',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface CreatePickerPageProps {
  params: Promise<{ slug: string; pickerId: string }>;
}

export default async function CreatePickerPage({
  params
}: CreatePickerPageProps) {
  const { pickerId, slug } = await params;

  const picker = await getUnvalidatedPickerForm({ pickerId });
  if (!picker.ok) {
    console.error('Error loading picker form:', picker);
    return <div>Error loading picker form: {picker.data.message}</div>;
  }

  const integrationsResult = await getTeamIntegrations({ slug });
  if (!integrationsResult.ok) {
    console.error('Error loading integrations:', integrationsResult);
    return (
      <div>Error loading integrations: {integrationsResult.data.message}</div>
    );
  }

  return (
    <PickerForm picker={picker.data} integrations={integrationsResult.data} />
  );
}
