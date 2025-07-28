import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '../../schema';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { SwitchBox, SwitchFormHeader } from '../switch-box';

export const RequireEmail = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name="audience.requireEmail"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <SwitchFormHeader
              label="Email Required"
              description="A valid email address is required to enter."
              help={
                <p>
                  A valid email address is required to enter. Some login
                  providers may not provide email addresses by default. Enabling
                  this field requires that a user's profile include a validated
                  email address or that the giveaway includes a step to collect
                  it.
                </p>
              }
            />
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};
