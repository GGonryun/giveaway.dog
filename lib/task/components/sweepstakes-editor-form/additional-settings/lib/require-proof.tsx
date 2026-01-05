import { useArrayContext } from '@/components/hooks/use-array-context';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import { FormField, FormItem, FormControl } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useFormContext } from 'react-hook-form';

export const RequireProofField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name={`tasks.${index}.requireProof`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Require Proof"
              description="Users must upload a screenshot proving they followed"
              help={{
                title: 'Help: Require Proof',
                content: (
                  <div className="space-y-2">
                    <p>
                      When enabled, users must upload a screenshot as proof of
                      following on Steam.
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        <strong>Accepted formats:</strong> GIF, JPEG, PNG, WEBP,
                        SVG
                      </li>
                      <li>
                        <strong>Maximum size:</strong> 3MB
                      </li>
                      <li>
                        <strong>When required:</strong> Upload is mandatory
                        immediately after clicking the follow button
                      </li>
                    </ul>
                  </div>
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
