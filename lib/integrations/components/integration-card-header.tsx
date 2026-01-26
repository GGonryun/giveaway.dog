import { ReactNode } from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IntegrationStatusBadge } from './integration-status-badge';
import { IntegrationSchema } from '../schemas';

interface IntegrationCardHeaderProps {
  icon: ReactNode;
  title: string;
  description: string;
  integration?: IntegrationSchema;
}

export function IntegrationCardHeader({
  icon,
  title,
  description,
  integration
}: IntegrationCardHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">{icon}</div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {description}
            </CardDescription>
          </div>
        </div>
        {integration && <IntegrationStatusBadge status={integration.status} />}
      </div>
    </CardHeader>
  );
}
