import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { HelpDialog } from '@giveaway/ui-layouts/help-dialog';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';
import { useFormContext } from 'react-hook-form';

export const LoyaltyRequiredField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.loyaltyRequired`}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-1">
            <FormLabel>Loyalty Required</FormLabel>
            <HelpDialog
              title="Help: Loyalty Required"
              content={
                <p>
                  Loyalty is a measure of how many of your hosted sweepstakes a
                  user has entered on giveaway.dog.
                  <br />
                  <br />A loyalty requirement of 5 means that the user must have
                  entered at least 5 of your sweepstakes to be eligible for this
                  task.
                </p>
              }
            />
          </div>
          <FormControl>
            <Input
              type="number"
              min={1}
              value={Number(field.value)}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
