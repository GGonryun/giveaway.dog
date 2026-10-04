import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@giveaway/ui-primitives/card';
import { Badge } from '@giveaway/ui-primitives/badge';
import type { UserSignals } from '@giveaway/audience-server/get-user-signals';
import {
  SIGNAL_LABEL,
  SIGNAL_ICON,
  SIGNAL_MAX,
  SIGNAL_QUALITY_KEYS
} from '@giveaway/scoring-ui/signal-display';
import { toQualityType } from '@giveaway/user-quality-model/quality';
import { QUALITY_BADGE_VARIANT } from '@giveaway/user-quality-ui/display';
import { cn } from '@giveaway/ui-utils/utils';

const OVERVIEW_SIGNALS = SIGNAL_QUALITY_KEYS.filter((k) =>
  [
    'emailVerified',
    'providersConnected',
    'accountAge',
    'taskActivity',
    'ipConsistency',
    'deviceStability'
  ].includes(k)
);

export const AccountSignalsCard: React.FC<{ signals: UserSignals }> = ({
  signals
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Health</CardTitle>
        <CardDescription>Key quality signals for this account</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {OVERVIEW_SIGNALS.map((key) => {
          const value = signals[key];
          const max = SIGNAL_MAX[key];
          const percentage = Math.min((value / max) * 100, 100);
          const type = toQualityType(percentage);
          const variant = QUALITY_BADGE_VARIANT[type];
          const Icon = SIGNAL_ICON[key];

          return (
            <div
              key={key}
              className="flex items-center justify-between gap-2 rounded-lg border p-2"
            >
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4 text-muted-foreground')} />
                <span className="text-sm font-medium">{SIGNAL_LABEL[key]}</span>
              </div>
              <Badge variant={variant}>{getSignalLabel(key, value, max)}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

const getSignalLabel = (
  key: (typeof OVERVIEW_SIGNALS)[number],
  value: number,
  max: number
): string => {
  const percentage = Math.min((value / max) * 100, 100);
  if (key === 'emailVerified') return value > 0 ? 'Verified' : 'Not verified';
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 70) return 'Good';
  if (percentage >= 50) return 'Fair';
  if (percentage >= 40) return 'Low';
  return 'None';
};
