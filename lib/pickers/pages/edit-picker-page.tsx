'use server';

import { PickerPageProps } from '@/schemas/pages';
import { PickerForm } from '../components/picker-form';
import { getUnvalidatedPickerForm } from '../procedures/get-unvalidated-picker-form';
import getTeamFeatureFlags from '@/procedures/teams/get-team-feature-flags';

type EditPickerPageProps = {
  params: Promise<PickerPageProps>;
};

export const EditPickerPage: React.FC<EditPickerPageProps> = async ({
  params
}) => {
  const pickerParams = await params;

  const picker = await getUnvalidatedPickerForm(pickerParams);
  const flags = await getTeamFeatureFlags(pickerParams);

  if (!picker.ok) {
    return <div>Error loading picker: {picker.data.message}</div>;
  }

  if (!flags.ok) {
    return <div>Error loading team feature flags: {flags.data.message}</div>;
  }

  return <PickerForm teamFeatureFlags={flags.data} picker={picker.data} />;
};
