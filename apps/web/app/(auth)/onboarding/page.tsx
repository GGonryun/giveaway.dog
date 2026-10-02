import { EmojiLogo } from '@/components/patterns/emoji-logo';
import { OnboardingForm } from '@/components/onboarding/onboarding-form';
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome | Giveaway.dog',
  description: 'Complete your Giveaway.dog profile setup',
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a
          href="/home"
          className="flex flex-col items-center gap-0 self-center font-medium "
        >
          <EmojiLogo />
        </a>
        <Suspense>
          <OnboardingForm />
        </Suspense>
      </div>
    </div>
  );
}
