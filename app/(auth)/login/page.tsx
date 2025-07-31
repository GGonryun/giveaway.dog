import { auth, signIn } from '@/lib/auth';
import { LoginForm } from './login-form';
import { SearchParams } from 'next/dist/server/request/search-params';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { connect } from './actions';
import { GalleryVerticalEnd } from 'lucide-react';
import { Typography } from '@/components/ui/typography';
// 🐶
export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const callbackUrl = (await searchParams).callbackUrl as string;
  const redirectTo = callbackUrl ?? '/';
  const session = await auth();

  if (session?.user) {
    redirect(redirectTo);
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a
          href="/"
          className="flex flex-col items-center gap-0 self-center font-medium "
        >
          <span
            role="img"
            aria-label="dog face"
            className="leading-none text-5xl"
          >
            🐶
          </span>
          <Typography weight="semibold" size="2xl">
            Giveaway.Dog
          </Typography>
        </a>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
