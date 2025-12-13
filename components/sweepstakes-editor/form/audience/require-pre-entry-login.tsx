import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';

export const RequirePreEntryLogin = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name="audience.requirePreEntryLogin"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Require Pre-Entry Login"
              description="Users must be logged in before viewing the giveaway."
              help={{
                title: 'Help: Require Pre-Entry Login',
                content: (
                  <p>
                    When enabled, users must be logged in to view the giveaway
                    details and entry form. This prevents anonymous users from
                    browsing your giveaway and ensures all participants are
                    authenticated before entering.
                  </p>
                )
              }}
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
