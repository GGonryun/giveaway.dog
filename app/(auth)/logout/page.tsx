'use server';

import { auth, signOut } from '@/lib/auth';
import { LogoutScreen } from './logout-screen';

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
      <LogoutScreen onDone={logout} />
    </div>
  );
}
