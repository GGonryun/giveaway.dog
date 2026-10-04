import { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';
import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import {
  SwitchBox,
  SwitchFormHeader
} from '@giveaway/ui-layouts/form-layout/switch-form-header';
import { Switch } from '@giveaway/ui-primitives/switch';

export const MaximumReferralsField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  const maximum = useWatch({
    control: form.control,
    name: `tasks.${index}.maximum`
  });

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name={`tasks.${index}.maximum`}
        render={({ field }) => (
          <FormItem>
            <div className="flex flex-row items-start justify-between">
              <SwitchFormHeader
                label="Maximum Referrals"
                description="Limit the number of referrals that can earn entries"
              />
              <FormControl>
                <Switch
                  checked={field.value != null}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      field.onChange(1);
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
      {maximum != null && (
        <FormField
          control={form.control}
          name={`tasks.${index}.maximum`}
          render={({ field }) => (
            <FormItem className="mt-3">
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  value={Number(field.value)}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value >= 1) {
                      field.onChange(value);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </SwitchBox>
  );
};
