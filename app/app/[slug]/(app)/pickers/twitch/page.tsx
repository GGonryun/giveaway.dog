import { TeamPageProps } from '@/schemas/pages';
import { PickerComingSoonCTA } from '@/lib/pickers/shared/components/picker-coming-soon-cta';

type TwitchPickersPageProps = {
  params: Promise<TeamPageProps>;
};

export default async function TwitchPickersPage(
  props: TwitchPickersPageProps
) {
  const { slug } = await props.params;

  return (
    <PickerComingSoonCTA
      slug={slug}
      title="Twitch Picker"
      description="Pick winners from your Twitch stream giveaways"
      platform="twitch"
    />
  );
}
