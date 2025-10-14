import { Badge } from '@/components/ui/badge';
import { PROVIDER_ICON } from '@/components/ui/patterns/provider-icon';
import { UserSchema } from '@/schemas/user';

export const UserProviders: React.FC<{
  user: UserSchema;
}> = ({ user }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {user.providers.map((provider) => {
        const Icon = PROVIDER_ICON[provider.type];
        return (
          <Badge key={provider.type} variant="outline">
            <Icon className="mr-1" />
            {provider.label}
          </Badge>
        );
      })}
    </div>
  );
};
