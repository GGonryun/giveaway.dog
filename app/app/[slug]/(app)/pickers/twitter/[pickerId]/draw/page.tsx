import { PickerDrawInterface } from '@/lib/pickers/components/picker-draw-interface';
import { getPublicPicker } from '@/lib/pickers/procedures/get-public-picker';

interface PageProps {
  params: Promise<{ slug: string; pickerId: string }>;
}

export default async function PickerDrawPage({ params: rawParams }: PageProps) {
  const params = await rawParams;

  const picker = await getPublicPicker({
    pickerId: params.pickerId
  });

  if (!picker.ok) {
    return <div>Picker data is invalid: {picker.data.message}</div>;
  }

  return (
    <PickerDrawInterface
      pickerId={picker.data.id}
      pickerName={picker.data.form.setup.name}
      postUrl={picker.data.form.setup.postUrl}
      numberOfWinners={picker.data.form.winners.quota}
      eligibleEntries={picker.data.stats.validEntries}
      alreadyDrawn={picker.data.draws.outcome.finalDraws.length > 0}
      teamSlug={params.slug}
      status={picker.data.status}
      draws={picker.data.draws.draws || []}
    />
  );
}
