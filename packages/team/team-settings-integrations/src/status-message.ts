export type StatusMessage = {
  type: 'success' | 'error';
  message: string;
  duration?: number;
};

const CONNECTION_FAILED = 'Failed to connect account';
const UNEXPECTED_ERROR = 'An unexpected error occurred';

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'The authorization was cancelled',
  missing_parameters: 'Missing required OAuth parameters',
  missing_code: 'Missing required OAuth parameters',
  invalid_state: 'The connection request is invalid. Please try again',
  expired_state: 'The connection request expired. Please try again',
  connection_failed: CONNECTION_FAILED,
  oauth_failed: CONNECTION_FAILED,
  parse_error: CONNECTION_FAILED,
  validation_error: CONNECTION_FAILED,
  forbidden:
    'You do not have permission to change the integrations of this team',
  bluesky_other_team:
    'This Bluesky account is already connected to another team',
  internal_server_error: UNEXPECTED_ERROR,
  unexpected_error: UNEXPECTED_ERROR
};

export const toErrorMessage = (code: string) =>
  Object.hasOwn(ERROR_MESSAGES, code) ? ERROR_MESSAGES[code] : UNEXPECTED_ERROR;

export const toStatusMessage = (
  searchParams: Pick<URLSearchParams, 'get'>
): StatusMessage | null => {
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  if (success === 'twitch_connected') {
    return {
      type: 'success',
      message: 'Successfully connected your Twitch channel',
      duration: 5000
    };
  }
  if (success === 'bluesky_connected') {
    return {
      type: 'success',
      message: 'Successfully connected your Bluesky account',
      duration: 5000
    };
  }
  if (success === 'discord_pending') {
    return {
      type: 'success',
      message:
        'Discord OAuth completed for your server. Complete installation by running /connect in your server.',
      duration: 10000
    };
  }
  if (error) {
    return { type: 'error', message: toErrorMessage(error) };
  }
  return null;
};
