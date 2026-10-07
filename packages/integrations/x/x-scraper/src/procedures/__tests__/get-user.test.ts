import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApplicationError } from '@giveaway/util-errors';
import {
  scrapeBadgerAuthor,
  scrapeBadgerUserResponse
} from '../../testing/fixtures-scrapebadger';
import { getUser } from '../get-user';

const m = vi.hoisted(() => ({
  getByUsername: vi.fn(),
  ScrapeBadger: vi.fn()
}));

vi.mock('scrapebadger', () => ({
  ScrapeBadger: m.ScrapeBadger
}));

describe('getUser', () => {
  beforeEach(() => {
    vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');
    m.getByUsername.mockReset();
    m.ScrapeBadger.mockReset();
    m.ScrapeBadger.mockImplementation(function () {
      return { twitter: { users: { getByUsername: m.getByUsername } } };
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('fetches the user by username with a client using the configured API key', async () => {
    m.getByUsername.mockResolvedValue(scrapeBadgerUserResponse);

    await getUser({ username: 'Alice' });

    expect(m.ScrapeBadger).toHaveBeenCalledWith({ apiKey: 'sb-key' });
    expect(m.getByUsername).toHaveBeenCalledWith('Alice');
  });

  it('returns the user from the API', async () => {
    m.getByUsername.mockResolvedValue(scrapeBadgerUserResponse);

    await expect(getUser({ username: 'alice' })).resolves.toEqual(
      scrapeBadgerAuthor()
    );
  });

  it('fills the name and the verified flag that the API leaves out', async () => {
    m.getByUsername.mockResolvedValue({ id: '1', username: 'alice' });

    await expect(getUser({ username: 'alice' })).resolves.toEqual({
      id: '1',
      username: 'alice',
      name: '',
      verified: false
    });
  });

  it('rejects with BAD_GATEWAY when the user does not match the schema', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.getByUsername.mockResolvedValue({ id: '1' });

    await expect(getUser({ username: 'alice' })).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
      data: { provider: 'scrapebadger', call: 'users.getByUsername' }
    });
  });

  it('logs the username being fetched', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    m.getByUsername.mockResolvedValue(scrapeBadgerUserResponse);

    await getUser({ username: 'alice' });

    expect(infoSpy).toHaveBeenCalledWith(
      '[ScrapeBadger] Fetching user details for username alice'
    );
  });

  it('propagates API errors', async () => {
    m.getByUsername.mockRejectedValue(new Error('suspended'));

    await expect(getUser({ username: 'alice' })).rejects.toThrow('suspended');
  });

  it('rejects with an application error when the API key is missing', async () => {
    vi.stubEnv('SCRAPEBADGER_API_KEY', '');

    const promise = getUser({ username: 'alice' });

    await expect(promise).rejects.toBeInstanceOf(ApplicationError);
    await expect(promise).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'SCRAPEBADGER_API_KEY environment variable not set'
    });
    expect(m.getByUsername).not.toHaveBeenCalled();
  });
});
