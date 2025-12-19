import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Notification Settings | Giveaway.dog',
  description: 'Manage your notification preferences',
  robots: {
    index: false,
    follow: false
  }
};

export default async function Page() {
  return (
    <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
      Notification settings coming soon!
    </div>
  );
}
