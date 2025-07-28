import { Typography } from '@/components/ui/typography';
import { GiveawayForm } from './create-giveaway';

export default async function Page() {
  return (
    <div className="max-w-xl space-y-4">
      <Typography.H1>Create a Giveaway</Typography.H1>
      <div>
        <GiveawayForm />
      </div>
    </div>
  );
}
