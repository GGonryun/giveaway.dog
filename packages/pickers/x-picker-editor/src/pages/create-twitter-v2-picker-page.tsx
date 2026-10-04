'use server';

import { TwitterV2PickerForm } from '../twitter-v2-picker-form';
import { getTwitterV2PickerForm } from '@giveaway/x-picker-server/procedures/get-twitter-v2-picker-form';

interface CreateTwitterV2PickerPageProps {
  params: Promise<{ pickerId: string; slug: string }>;
}

export const CreateTwitterV2PickerPage: React.FC<
  CreateTwitterV2PickerPageProps
> = async ({ params }) => {
  const { pickerId } = await params;

  // Try to load existing picker data (in case user navigates back to create URL)
  const picker = await getTwitterV2PickerForm({ pickerId });

  if (!picker.ok) {
    return <div>Error loading picker form: {picker.data.message}</div>;
  }

  return <TwitterV2PickerForm picker={picker.data} />;
};
