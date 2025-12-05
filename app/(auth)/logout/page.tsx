'use server';

import { auth, signOut } from '@/lib/auth/config';
import { LogoutScreen } from './logout-screen';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Logging Out | Giveaway.dog',
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function Page() {
  const session = await auth();

  async function logout() {
    'use server';
    if (session?.user) {
      await signOut({ redirectTo: '/' });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <LogoutScreen onDoneAction={logout} />
    </div>
  );
}
