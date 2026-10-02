import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  action
}: FeatureCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 space-y-0">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
            {action && <div className="mt-4">{action}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
