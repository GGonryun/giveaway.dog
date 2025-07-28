import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '../../schema';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { SwitchBox, SwitchFormHeader } from '../switch-box';

export const RequirePreEntryLogin = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name="audience.requirePreEntryLogin"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <SwitchFormHeader
              label="Pre-Entry Login"
              description="Force the user to login before they
                  can see entry methods."
              help={
                <p>
                  Force the user to login or provide details first before they
                  see how to enter. This can help ensure that only engaged users
                  participate.
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
