import { assertNever } from '@/lib/errors';
import { UserSchema } from '@/schemas/user';

export const UserSourceCaption: React.FC<{
  user: Pick<UserSchema, 'email' | 'source' | 'providers'>;
}> = ({ user }) => {
  switch (user.source) {
    case 'SIGNUP':
      return <>{user.email ?? 'No email'}</>;
    case 'TWITTER_IMPORT': {
      const provider = user.providers?.find((p) => p.type === 'TWITTER');
      if (!provider) {
        return <>Imported from X</>;
      }
      return <>@{provider.label}</>;
    }
    case 'DISCORD_IMPORT':
      return <>Imported from Discord</>;
    case 'MANUAL_IMPORT':
      return <>Manually imported</>;
    case 'ANONYMOUS':
      return <>Anonymous user</>;
    default:
      throw assertNever(user.source);
  }
};
