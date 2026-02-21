import { SelectPickerList } from '@/lib/pickers/components/select-picker-list';
import { Outline } from '@/components/app/outline';

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
