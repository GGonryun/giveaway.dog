// Determine final redirect URL
export const getUserAuthRedirect = ({
  redirectTo
}: {
  redirectTo?: string;
}) => {
  // If a specific redirect was requested, honor that first
  if (redirectTo && redirectTo.trim() !== '') return redirectTo;
  // default fallback for participating
  return '/browse';
};
