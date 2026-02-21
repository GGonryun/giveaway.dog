import { Outline } from '@/components/app/outline';
import { SelectPickerList } from '@/lib/pickers/shared/components/select-picker-list';

interface PickersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PickersPage({ params }: PickersPageProps) {
  const { slug } = await params;

  return (
    <Outline title="All Pickers">
      <SelectPickerList slug={slug} />
    </Outline>
  );
}
