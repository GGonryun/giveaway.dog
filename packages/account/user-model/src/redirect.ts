import { UserAccountType } from '@giveaway/db-model';

const SAFE_REDIRECT_BASE = 'http://giveaway.invalid';

export const toSafeRedirect = (
  value: string | null | undefined,
  fallback: string
) => {
  if (!value || !value.startsWith('/')) return fallback;

  const url = new URL(value, SAFE_REDIRECT_BASE);
  if (url.origin !== SAFE_REDIRECT_BASE) return fallback;

  return `${url.pathname}${url.search}${url.hash}`;
};

export const fromCallbackUrl = (
  value: string | null | undefined,
  host: string | null | undefined
) => {
  const base = `http://${host}`;
  if (!value || !host || !URL.canParse(value, base)) return '';

  const url = new URL(value, base);
  if (url.host !== new URL(base).host) return '';

  return toSafeRedirect(`${url.pathname}${url.search}${url.hash}`, '');
};

export const getUserAuthRedirect = ({
  redirectTo,
  accountType
}: {
  redirectTo?: string;
  accountType?: UserAccountType;
}) => {
  const fallback = accountType === UserAccountType.HOST ? '/app' : '/browse';

  return toSafeRedirect(redirectTo, fallback);
};
