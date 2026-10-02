import { useArrayContext } from '@/components/hooks/use-array-context';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useFormContext, useWatch } from 'react-hook-form';
import pluralize from 'pluralize';

export const TwitterVerifiedBonusField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  const verifiedBonus = useWatch({
    control: form.control,
    name: `tasks.${index}.verifiedBonus`
  });

  const isEnabled = verifiedBonus != null && verifiedBonus > 0;

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name={`tasks.${index}.verifiedBonus`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="X Verified Bonus"
              description="Reward users with a verified checkmark on X (Twitter) with bonus entries."
              help={{
                title: 'Help: X Verified Bonus',
                content: (
                  <div className="space-y-4">
                    <p>
                      <strong>Boost engagement from verified X users!</strong>
                    </p>
                    <p>
                      When enabled, users with a verified checkmark (blue, gold,
                      or gray) on X will automatically receive additional bonus
                      entries when they complete this task.
                    </p>
                    <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950 p-3 rounded">
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        Example
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm mt-2 text-blue-800 dark:text-blue-200">
                        <li>
                          Task value: <strong>5 entries</strong>
                        </li>
                        <li>
                          Verified bonus: <strong>10 entries</strong>
                        </li>
                        <li>
                          Unverified users get: <strong>5 entries</strong>
                        </li>
                        <li>
                          Verified users get: <strong>15 entries total</strong>{' '}
                          (5 + 10 bonus)
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold">Why use this?</p>
                      <ul className="list-disc list-inside space-y-1 text-sm mt-1">
                        <li>
                          <strong>Higher quality engagement:</strong> Verified
                          accounts are more likely to be real people
                        </li>
                        <li>
                          <strong>Better reach:</strong> Verified users often
                          have larger, more engaged audiences
                        </li>
                        <li>
                          <strong>Reduced spam:</strong> Incentivize
                          participation from authentic accounts
                        </li>
                        <li>
                          <strong>Premium appeal:</strong> Make your giveaway
                          more attractive to influential users
                        </li>
                      </ul>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Note: Works with all X verification types (blue checkmark
                      for X Premium, gold for organizations, gray for
                      government/multilateral).
                    </p>
                  </div>
                )
              }}
            />
            <FormControl>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    field.onChange(1);
                  } else {
                    field.onChange(undefined);
                  }
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {isEnabled && (
        <FormField
          control={form.control}
          name={`tasks.${index}.verifiedBonus`}
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    className="w-18"
                    value={field.value ?? 1}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      field.onChange(isNaN(value) ? 1 : Math.max(1, value));
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    bonus {pluralize('entry', field.value ?? 1)} for verified
                    users
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </SwitchBox>
  );
};
