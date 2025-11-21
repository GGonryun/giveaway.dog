import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ProviderSchema } from '../schemas/providers';
import { PROVIDER_ICON } from './icons/provider-icon';

export const UserProviders: React.FC<{
  providers: ProviderSchema[];
}> = ({ providers }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {providers.map((provider) => {
        const Icon = PROVIDER_ICON[provider.type];
        return (
          <Badge key={provider.type} variant="outline" asChild>
            <Link
              href={provider.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon className="mr-1" />
              {provider.label}
            </Link>
          </Badge>
        );
      })}
    </div>
  );
};
