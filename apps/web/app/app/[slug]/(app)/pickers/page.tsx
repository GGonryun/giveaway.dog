import { Outline } from '@giveaway/shell-sidebar/app/outline';
import { SelectPickerList } from '@giveaway/picker-ui/components/select-picker-list';

interface PickersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PickersPage({ params }: PickersPageProps) {
  const { slug } = await params;

  return (
    <Outline
      title="All Pickers"
      className="my-auto mx-auto flex items-center justify-center"
    >
      <SelectPickerList slug={slug} />
    </Outline>
  );
}
