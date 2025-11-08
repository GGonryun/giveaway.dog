'use server';

import { PickerPageProps } from '@/schemas/pages';
import { PickerForm } from '../components/picker-form';
import { getUnvalidatedPickerForm } from '../procedures/get-unvalidated-picker-form';
import getTeamFeatureFlags from '@/procedures/teams/get-team-feature-flags';
import { getTeamIntegrations } from '@/lib/integrations/procedures/get-team-integrations';

type EditPickerPageProps = {
  params: Promise<PickerPageProps>;
};

export const EditPickerPage: React.FC<EditPickerPageProps> = async ({
  params
}) => {
  const pickerParams = await params;

  const picker = await getUnvalidatedPickerForm(pickerParams);
  const flags = await getTeamFeatureFlags(pickerParams);
  const integrationsResult = await getTeamIntegrations(pickerParams);

  if (!picker.ok) {
    return <div>Error loading picker: {picker.data.message}</div>;
  }

  if (!flags.ok) {
    return <div>Error loading team feature flags: {flags.data.message}</div>;
  }

  if (!integrationsResult.ok) {
    return (
      <div>Error loading integrations: {integrationsResult.data.message}</div>
    );
  }

  return (
    <PickerForm
      teamFeatureFlags={flags.data}
      picker={picker.data}
      integrations={integrationsResult.data}
    />
  );
};
