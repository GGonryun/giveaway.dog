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

export const VerifiedBonusField: React.FC = () => {
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
              label="Verified User Bonus"
              description="Award additional bonus entries to users who have a verified account on X."
              help={{
                title: 'Help: Verified User Bonus',
                content: (
                  <div className="space-y-4">
                    <p>
                      When enabled, users who have verified their account (via
                      email, phone, or other verification methods) will receive
                      additional bonus entries for completing this task.
                    </p>
                    <p>
                      <strong>Example:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        If the task is worth <strong>5 entries</strong> and the
                        verified bonus is <strong>3 entries</strong>
                      </li>
                      <li>
                        Unverified users will receive <strong>5 entries</strong>
                      </li>
                      <li>
                        Verified users will receive{' '}
                        <strong>8 entries total</strong> (5 + 3 bonus)
                      </li>
                    </ul>
                    <p>
                      <strong>Benefits:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Encourages users to verify their accounts</li>
                      <li>
                        Reduces spam and fake entries from unverified accounts
                      </li>
                      <li>
                        Rewards genuine participants with better chances to win
                      </li>
                    </ul>
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
                    className="w-16"
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
