'use server';

import { TwitterV2PickerForm } from '../components/twitter-v2-picker-form';
import { getTwitterV2PickerForm } from '@giveaway/x-picker-server/procedures/get-twitter-v2-picker-form';

interface EditTwitterV2PickerPageProps {
  params: Promise<{ pickerId: string; slug: string }>;
}

export const EditTwitterV2PickerPage: React.FC<
  EditTwitterV2PickerPageProps
> = async ({ params }) => {
  const { pickerId } = await params;

  const pickerResult = await getTwitterV2PickerForm({ pickerId });

  if (!pickerResult.ok) {
    return <div>Error loading picker: {pickerResult.data.message}</div>;
  }

  return <TwitterV2PickerForm picker={pickerResult.data} />;
};
