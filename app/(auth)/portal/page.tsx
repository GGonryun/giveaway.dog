import { Suspense } from 'react';
import { AuthPortal } from './auth-portal';

export const dynamic = 'force-dynamic';

export default async function PortalPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }
        >
          <AuthPortal />
        </Suspense>
      </div>
    </div>
  );
}
