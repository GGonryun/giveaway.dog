import { describe, expect, it } from 'vitest';
import { toErrorMessage, toStatusMessage } from '../status-message';

const params = (values: Record<string, string>) => new URLSearchParams(values);

describe('toStatusMessage', () => {
  it('returns null without a status parameter', () => {
    expect(toStatusMessage(params({}))).toBeNull();
  });

  it('shows the message of a known error code', () => {
    expect(toStatusMessage(params({ error: 'access_denied' }))).toEqual({
      type: 'error',
      message: 'The authorization was cancelled'
    });
  });

  it('shows a generic message for an unknown error code, never its text', () => {
    expect(
      toStatusMessage(params({ error: 'Your account is suspended' }))
    ).toEqual({ type: 'error', message: 'An unexpected error occurred' });
  });

  it.each([
    ['access_denied', 'The authorization was cancelled'],
    ['missing_parameters', 'Missing required OAuth parameters'],
    ['missing_code', 'Missing required OAuth parameters'],
    ['invalid_state', 'The connection request is invalid. Please try again'],
    ['expired_state', 'The connection request expired. Please try again'],
    ['connection_failed', 'Failed to connect account'],
    ['oauth_failed', 'Failed to connect account'],
    ['parse_error', 'Failed to connect account'],
    ['validation_error', 'Failed to connect account'],
    [
      'forbidden',
      'You do not have permission to change the integrations of this team'
    ],
    [
      'bluesky_other_team',
      'This Bluesky account is already connected to another team'
    ],
    ['internal_server_error', 'An unexpected error occurred'],
    ['unexpected_error', 'An unexpected error occurred']
  ])('shows the message of the %s code', (code, message) => {
    expect(toErrorMessage(code)).toBe(message);
  });

  it.each(['toString', '__proto__', 'constructor', 'hasOwnProperty'])(
    'shows a generic message for the inherited key %s',
    (code) => {
      expect(toErrorMessage(code)).toBe('An unexpected error occurred');
    }
  );

  it('shows the Twitch success message without the username parameter', () => {
    expect(
      toStatusMessage(
        params({ success: 'twitch_connected', username: 'Send money to me' })
      )
    ).toEqual({
      type: 'success',
      message: 'Successfully connected your Twitch channel',
      duration: 5000
    });
  });

  it('shows the Bluesky success message without the handle parameter', () => {
    expect(
      toStatusMessage(
        params({ success: 'bluesky_connected', handle: 'Send money to me' })
      )
    ).toEqual({
      type: 'success',
      message: 'Successfully connected your Bluesky account',
      duration: 5000
    });
  });

  it('shows the Discord message without the guild parameter', () => {
    expect(
      toStatusMessage(
        params({ success: 'discord_pending', guild: 'Send money to me' })
      )
    ).toEqual({
      type: 'success',
      message:
        'Discord OAuth completed for your server. Complete installation by running /connect in your server.',
      duration: 10000
    });
  });

  it('prefers a success over an error', () => {
    expect(
      toStatusMessage(
        params({ success: 'twitch_connected', error: 'unexpected_error' })
      )?.type
    ).toBe('success');
  });

  it('shows the error for an unknown success code', () => {
    expect(
      toStatusMessage(params({ success: 'nope', error: 'connection_failed' }))
    ).toEqual({ type: 'error', message: 'Failed to connect account' });
  });
});
