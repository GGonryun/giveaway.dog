import { UserType } from '@prisma/client';

// Determine final redirect URL based on userTypes
export const getUserAuthRedirect = ({
  redirectTo,
  userTypes
}: {
  redirectTo?: string;
  userTypes?: UserType[] | null;
}) => {
  // If a specific redirect was requested, honor that first
  if (redirectTo) return redirectTo;
  // If no user types, default to browse
  if (!userTypes || userTypes.length === 0) return '/browse';
  // Prioritize hosting if selected (they can also browse)
  if (userTypes.includes('HOST')) return '/app';
  // If only participating, go to browse page
  if (userTypes.includes('PARTICIPATE')) return '/browse';
  // default fallback for participating
  return '/browse';
};
