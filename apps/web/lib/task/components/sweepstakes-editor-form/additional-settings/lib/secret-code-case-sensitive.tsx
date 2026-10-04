import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import {
  SwitchBox,
  SwitchFormHeader
} from '@giveaway/ui-layouts/form-layout/switch-form-header';
import { FormControl, FormField, FormItem } from '@giveaway/ui-primitives/form';
import { Switch } from '@giveaway/ui-primitives/switch';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useFormContext } from 'react-hook-form';

export const SecretCodeCaseSensitiveFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name={`tasks.${index}.caseSensitive`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Case Sensitive"
              description="When enabled, the secret code must match the exact case (uppercase/lowercase) you specified."
              help={{
                title: 'Help: Case Sensitive',
                content: (
                  <div className="space-y-4">
                    <p>
                      When case sensitivity is enabled, users must enter the
                      secret code exactly as you specified it, including
                      matching uppercase and lowercase letters.
                    </p>
                    <p>
                      <strong>Example:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        If your code is{' '}
                        <code className="bg-muted px-1">DoG2025</code>, users
                        must enter exactly{' '}
                        <code className="bg-muted px-1">DoG2025</code>
                      </li>
                      <li>
                        Entries like{' '}
                        <code className="bg-muted px-1">dog2025</code> or{' '}
                        <code className="bg-muted px-1">DOG2025</code> will be
                        rejected
                      </li>
                    </ul>
                    <p>
                      When disabled, the code will match regardless of case, so{' '}
                      <code className="bg-muted px-1">DoG2025</code>,{' '}
                      <code className="bg-muted px-1">dog2025</code>, and{' '}
                      <code className="bg-muted px-1">DOG2025</code> will all be
                      accepted.
                    </p>
                  </div>
                )
              }}
            />
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};
