export const isNextRedirect = (err: any): err is Error => {
  const isDigest =
    'digest' in err &&
    typeof err.digest === 'string' &&
    err.digest.startsWith('NEXT_REDIRECT');
  const isMessage =
    'message' in err &&
    typeof err.message === 'string' &&
    err.message.startsWith('NEXT_REDIRECT');
  return isDigest && isMessage;
};
