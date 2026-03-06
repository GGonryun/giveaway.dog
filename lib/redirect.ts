import { UserAccountType } from '@prisma/client';

// Determine final redirect URL
export const getUserAuthRedirect = ({
  redirectTo,
  accountType
}: {
  redirectTo?: string;
  accountType?: UserAccountType;
}) => {
  // If a specific redirect was requested, honor that first
  if (redirectTo && redirectTo.trim() !== '') return redirectTo;

  // Redirect based on account type
  if (accountType === UserAccountType.HOST) return '/app';

  // default fallback for participating
  return '/browse';
};
