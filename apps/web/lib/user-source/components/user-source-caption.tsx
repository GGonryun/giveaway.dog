import { ObfuscatedEmail } from '@/components/ui/obfuscated-email';
import { assertNever } from '@giveaway/util-errors';
import { UserSchema } from '@/schemas/user';

export const UserSourceCaption: React.FC<{
  user: Pick<UserSchema, 'email' | 'source' | 'providers'>;
}> = ({ user }) => {
  switch (user.source) {
    case 'SIGNUP':
      return user.email ? (
        <ObfuscatedEmail size="xs" canReveal={false} email={user.email} />
      ) : (
        <>No email</>
      );
    case 'TWITTER_IMPORT': {
      const provider = user.providers?.find((p) => p.type === 'TWITTER');
      if (!provider) {
        return <>Imported from X</>;
      }
      return <>@{provider.label}</>;
    }
    case 'BLUESKY_IMPORT': {
      const provider = user.providers?.find((p) => p.type === 'BLUESKY');
      if (!provider) {
        return <>Imported from Bluesky</>;
      }
      return <>@{provider.label}</>;
    }
    case 'DISCORD_IMPORT': {
      const provider = user.providers?.find((p) => p.type === 'DISCORD');
      if (!provider) {
        return <>Imported from Discord</>;
      }
      return <>@{provider.label}</>;
    }
    case 'TWITCH_IMPORT': {
      const provider = user.providers?.find((p) => p.type === 'TWITCH');
      if (!provider) {
        return <>Imported from Twitch</>;
      }
      return <>@{provider.label}</>;
    }
    case 'MANUAL_IMPORT':
      return <>Manually imported</>;
    case 'ANONYMOUS':
      return <>Anonymous user</>;
    default:
      throw assertNever(user.source);
  }
};
