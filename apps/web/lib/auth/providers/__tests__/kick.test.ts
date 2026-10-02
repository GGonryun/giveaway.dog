import { describe, it, expect } from 'vitest';
import { KickProvider, type KickProfile } from '../kick';

const options = { clientId: 'kick-id', clientSecret: 'kick-secret' };

const kickProfile = (
  users: KickProfile['data'] = [
    {
      user_id: 12345,
      name: 'Streamer',
      email: 'streamer@example.com',
      profile_picture: 'https://kick.com/avatar.png'
    }
  ]
): KickProfile => ({ data: users, message: 'OK' });

const callProfile = (profile: KickProfile) => {
  const provider = KickProvider(options);
  return provider.profile?.(profile, {});
};

describe('KickProvider', () => {
  describe('configuration', () => {
    it('identifies itself as the kick oauth provider', () => {
      const provider = KickProvider(options);

      expect(provider).toMatchObject({
        id: 'kick',
        name: 'Kick',
        type: 'oauth'
      });
    });

    it('authenticates the token request with client_secret_post', () => {
      expect(KickProvider(options).client).toEqual({
        token_endpoint_auth_method: 'client_secret_post'
      });
    });

    it('authorizes against id.kick.com with the user:read scope', () => {
      expect(KickProvider(options).authorization).toEqual({
        url: 'https://id.kick.com/oauth/authorize',
        params: { response_type: 'code', scope: 'user:read' }
      });
    });

    it('uses the kick token and userinfo endpoints', () => {
      const provider = KickProvider(options);

      expect(provider.token).toBe('https://id.kick.com/oauth/token');
      expect(provider.userinfo).toBe('https://api.kick.com/public/v1/users');
    });

    it('requires pkce and state checks', () => {
      expect(KickProvider(options).checks).toEqual(['pkce', 'state']);
    });

    it('uses the kick brand colors', () => {
      expect(KickProvider(options).style).toEqual({
        bg: '#53fc18',
        text: '#000'
      });
    });

    it('passes the user options through unchanged', () => {
      expect(KickProvider(options).options).toBe(options);
    });
  });

  describe('profile', () => {
    it('maps the first user in the response to a next-auth user', async () => {
      expect(await callProfile(kickProfile())).toEqual({
        id: '12345',
        name: 'Streamer',
        email: 'streamer@example.com',
        image: 'https://kick.com/avatar.png'
      });
    });

    it('stringifies the numeric user id', async () => {
      const user = await callProfile(
        kickProfile([
          {
            user_id: 0,
            name: 'Zero',
            email: 'z@example.com',
            profile_picture: ''
          }
        ])
      );

      expect(user?.id).toBe('0');
    });

    it('ignores additional users in the response', async () => {
      const user = await callProfile(
        kickProfile([
          { user_id: 1, name: 'First', email: 'a@x.com', profile_picture: 'a' },
          { user_id: 2, name: 'Second', email: 'b@x.com', profile_picture: 'b' }
        ])
      );

      expect(user?.name).toBe('First');
    });

    it('throws a TypeError when the response has no users', () => {
      expect(() => callProfile(kickProfile([]))).toThrow(TypeError);
    });
  });
});
