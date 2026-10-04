import { TeamPageProps } from '@giveaway/sweepstakes-model/pages';
import { PickerComingSoonCTA } from '@/lib/pickers/shared/components/picker-coming-soon-cta';

type DiscordPickersPageProps = {
  params: Promise<TeamPageProps>;
};

export default async function DiscordPickersPage(
  props: DiscordPickersPageProps
) {
  const { slug } = await props.params;

  return (
    <PickerComingSoonCTA
      slug={slug}
      title="Discord Picker"
      description="Pick winners from your Discord server giveaways"
      platform="discord"
    />
  );
}
