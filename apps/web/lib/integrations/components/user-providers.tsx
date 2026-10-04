import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ProviderSchema } from '@giveaway/integration-model/providers';
import { PROVIDER_ICON } from './icons/provider-icon';
import { strings } from '@giveaway/util-strings/strings';

export const UserProviders: React.FC<{
  providers: ProviderSchema[];
}> = ({ providers }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {providers.map((provider) => {
        const Icon = PROVIDER_ICON[provider.type];
        const label =
          provider.type === 'GOOGLE'
            ? strings.obfuscate(provider.label)
            : provider.label;
        return (
          <Badge key={provider.type} variant="outline" asChild>
            <Link
              href={provider.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon className="mr-1" />
              {label}
            </Link>
          </Badge>
        );
      })}
    </div>
  );
};
