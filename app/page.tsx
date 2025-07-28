import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';
import { LogInIcon, LogOutIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';

export default async function Page() {
  const session = await auth();
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-bold">Welcome to Giveaway Dog</h1>
      <div>{session ? <SessionMenu /> : <NoSession />}</div>
    </div>
  );
}

const NoSession = () => {
  return (
    <Button className="w-fit" asChild>
      <Link href="/login">
        <LogInIcon />
        Log In
      </Link>
    </Button>
  );
};

const SessionMenu = () => {
  return (
    <div className="space-x-2">
      <Button asChild>
        <Link href="/host">
          <PlusIcon />
          Create
        </Link>
      </Button>
      <Button asChild>
        <Link href="/logout">
          <LogOutIcon />
          Log Out
        </Link>
      </Button>
    </div>
  );
};
