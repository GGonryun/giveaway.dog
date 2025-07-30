import { Typography } from '@/components/ui/typography';
import { GiveawayForm } from './create-giveaway';

export default async function Page() {
  return (
    <div className="w-full max-w-lg space-y-4 mx-auto">
      <Typography.H1>Create a Giveaway</Typography.H1>
      <GiveawayForm />
    </div>
  );
}
