import { SweepstakesParticipantSchema } from '@/schemas/giveaway/participant';

export const UserSourceCaption: React.FC<{
  user: Pick<SweepstakesParticipantSchema, 'email' | 'source' | 'providers'>;
}> = ({ user }) => {
  switch (user.source) {
    case 'SIGNUP':
      return <>{user.email ?? 'No email'}</>;
    case 'TWITTER_IMPORT': {
      const provider = user.providers?.find((p) => p.type === 'twitter');
      if (!provider) {
        return <>Imported from X</>;
      }
      return <>@{provider.label}</>;
    }
    case 'DISCORD_IMPORT':
      return <>Imported from Discord</>;
    case 'MANUAL_IMPORT':
      return <>Manually imported</>;
    default:
      return <>Unknown source</>;
  }
};
