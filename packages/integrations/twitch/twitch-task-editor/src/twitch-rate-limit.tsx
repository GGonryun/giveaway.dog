import { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';
import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage
} from '@giveaway/ui-primitives/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@giveaway/ui-primitives/select';
import {
  SwitchBox,
  SwitchFormHeader
} from '@giveaway/ui-layouts/form-layout/switch-form-header';
import { Switch } from '@giveaway/ui-primitives/switch';
import { TwitchChatImportTaskSchema } from '@giveaway/task-model/schemas';

type RateLimit = NonNullable<TwitchChatImportTaskSchema['rateLimit']>;

type RateLimitPreset = '30s' | '5m' | '1h' | '1d' | 'unlimited';

const RATE_LIMIT_PRESETS: Record<RateLimitPreset, RateLimit> = {
  '30s': { max: 1, window: { value: 30, unit: 's' } },
  '5m': { max: 1, window: { value: 5, unit: 'm' } },
  '1h': { max: 1, window: { value: 1, unit: 'h' } },
  '1d': { max: 1, window: { value: 1, unit: 'd' } },
  unlimited: { max: 1, window: { value: 1, unit: 's' } }
};

const RATE_LIMIT_LABELS: Record<RateLimitPreset, string> = {
  '30s': 'Once every 30 seconds',
  '5m': 'Once every 5 minutes',
  '1h': 'Once every hour',
  '1d': 'Once a day',
  unlimited: 'Unlimited'
};

const toPreset = (rateLimit: RateLimit | null | undefined): RateLimitPreset => {
  if (!rateLimit) return '30s';
  const { value, unit } = rateLimit.window;
  if (unit === 's' && value === 1) return 'unlimited';
  if (unit === 's' && value === 30) return '30s';
  if (unit === 'm' && value === 5) return '5m';
  if (unit === 'h' && value === 1) return '1h';
  if (unit === 'd' && value === 1) return '1d';
  return '30s';
};

export const TwitchRateLimitField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  const rateLimit = useWatch({
    control: form.control,
    name: `tasks.${index}.rateLimit`
  });

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name={`tasks.${index}.rateLimit`}
        render={({ field }) => (
          <FormItem>
            <div className="flex flex-row items-start justify-between">
              <SwitchFormHeader
                label="Set participation limits"
                description="When enabled, users can participate more than once based on the selected interval."
              />
              <FormControl>
                <Switch
                  checked={field.value != null}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      field.onChange(RATE_LIMIT_PRESETS['30s']);
                    } else {
                      field.onChange(null);
                    }
                  }}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      {rateLimit != null && (
        <FormField
          control={form.control}
          name={`tasks.${index}.rateLimit`}
          render={({ field }) => (
            <FormItem className="mt-3">
              <FormLabel>Users can enter:</FormLabel>
              <Select
                value={toPreset(field.value as RateLimit | null)}
                onValueChange={(preset: RateLimitPreset) => {
                  field.onChange(RATE_LIMIT_PRESETS[preset]);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(RATE_LIMIT_PRESETS) as RateLimitPreset[]).map(
                    (preset) => (
                      <SelectItem key={preset} value={preset}>
                        {RATE_LIMIT_LABELS[preset]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </SwitchBox>
  );
};
