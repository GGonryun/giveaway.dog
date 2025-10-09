const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'throwaway.email',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'fakeinbox.com',
  'yopmail.com',
  'temp-mail.org',
  'getnada.com',
  'trashmail.com',
  'maildrop.cc',
  'sharklasers.com',
  'guerrillamailblock.com',
  'spam4.me',
  'grr.la',
  'discard.email'
];

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedEmail.length < 3 || trimmedEmail.length > 254) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }

  const domain = trimmedEmail.split('@')[1];
  if (!domain) {
    return false;
  }

  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return false;
  }

  if (domain.includes('..')) {
    return false;
  }

  if (domain.startsWith('.') || domain.endsWith('.')) {
    return false;
  }

  return true;
}
