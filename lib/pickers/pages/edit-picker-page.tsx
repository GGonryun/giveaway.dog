'use server';

import { PickerPageProps } from '@/schemas/pages';
import { PickerForm } from '../components/picker-form';
import { getUnvalidatedPickerForm } from '../procedures/get-unvalidated-picker-form';
import { getTeamIntegrations } from '@/lib/integrations/procedures/get-team-integrations';

type EditPickerPageProps = {
  params: Promise<PickerPageProps>;
};

export const EditPickerPage: React.FC<EditPickerPageProps> = async ({
  params
}) => {
  const pickerParams = await params;

  const picker = await getUnvalidatedPickerForm(pickerParams);
  const integrationsResult = await getTeamIntegrations(pickerParams);

  if (!picker.ok) {
    return <div>Error loading picker: {picker.data.message}</div>;
  }

  if (!integrationsResult.ok) {
    return (
      <div>Error loading integrations: {integrationsResult.data.message}</div>
    );
  }

  return (
    <PickerForm picker={picker.data} integrations={integrationsResult.data} />
  );
};
