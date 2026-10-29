import { LinkResultAlert } from '@giveaway/account-profile/link-result-alert';
import { UserSettings } from '@giveaway/account-profile/user-profile';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Account | Giveaway.dog',
  description: 'Manage your account settings',
  robots: {
    index: false,
    follow: false
  }
};

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, merged } = await searchParams;

  return (
    <div className="space-y-4">
      <LinkResultAlert
        error={typeof error === 'string' ? error : null}
        merged={merged === 'true'}
      />
      <UserSettings />
    </div>
  );
}
