import { EmojiLogo } from '@giveaway/ui-brand/emoji-logo';
import { LoginForm } from './login-form';
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Login | Giveaway.dog',
  description: 'Log in to manage your giveaways',
  robots: {
    index: false,
    follow: false
  }
};

export default async function LoginPage() {
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
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
