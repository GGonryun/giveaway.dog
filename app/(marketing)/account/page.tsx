import { UserPage } from '@/components/account/page';
import { isUserSection } from '@/schemas/account';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ tab: string }>;
}) {
  const resolvedParams = await searchParams;
  const tab = isUserSection(resolvedParams.tab)
    ? resolvedParams.tab
    : 'overview';

  return <UserPage tab={tab} />;
}
