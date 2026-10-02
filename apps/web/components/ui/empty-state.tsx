import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LucideIcon } from 'lucide-react';

interface TrackedItem {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
}

interface EmptyStateProps {
  title: string;
  description: string;
  alertMessage: string;
  trackedItems: TrackedItem[];
  footerMessage: string;
}

export function EmptyState({
  title,
  description,
  alertMessage,
  trackedItems,
  footerMessage
}: EmptyStateProps) {
  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>{alertMessage}</AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">
              What we're tracking:
            </h4>
            <div className="grid gap-3">
              {trackedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="p-2 rounded-lg bg-muted">
                    <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">{footerMessage}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
