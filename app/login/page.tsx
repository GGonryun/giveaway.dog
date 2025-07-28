import { auth, signIn } from '@/lib/auth';
import { GalleryVerticalEnd } from 'lucide-react';
import { LoginForm } from './login-form';
import { SearchParams } from 'next/dist/server/request/search-params';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function LoginPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const callbackUrl = (await Promise.resolve(searchParams))
    .callbackUrl as string;
  const redirectTo = callbackUrl ?? '/';
  const session = await auth();

  if (session?.user) {
    redirect(redirectTo);
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              🐶
            </div>
            Giveaway.Dog
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm
              action={async (data) => {
                'use server';
                if (data.get('login') === 'github') {
                  await signIn('github', {
                    redirectTo
                  });
                } else {
                  console.error('Invalid login method');
                }
              }}
            />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
