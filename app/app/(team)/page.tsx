import { EmojiLogo } from '@/components/patterns/emoji-logo';
import { TeamPickerForm } from '@/components/team/team-picker-form';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function TeamPickerPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a
          href="/"
          className="flex flex-col items-center gap-0 self-center font-medium "
        >
          <EmojiLogo />
        </a>
        <Suspense>
          <TeamPickerForm />
        </Suspense>
      </div>
    </div>
  );
}
