import { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';
import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import { Textarea } from '@giveaway/ui-primitives/textarea';
import { Button } from '@giveaway/ui-primitives/button';
import { PlusIcon, TrashIcon } from 'lucide-react';

export const MultipleChoiceFormFields: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `tasks.${index}.options` as any
  });

  return (
    <>
      <FormField
        control={form.control}
        name={`tasks.${index}.question`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Question</FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} />
            </FormControl>
            <FormDescription>
              The question you want to ask participants
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div>
        <FormLabel>Options</FormLabel>
        <FormDescription className="mb-2">
          Add options for participants to choose from (minimum 2)
        </FormDescription>
        <div className="space-y-2">
          {fields.map((field, optionIndex) => (
            <div key={field.id} className="flex gap-2">
              <FormField
                control={form.control}
                name={`tasks.${index}.options.${optionIndex}`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => remove(optionIndex)}
                disabled={fields.length <= 2}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append('')}
          className="mt-2"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`tasks.${index}.minSelections`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Selections (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? undefined : Number(value));
                  }}
                />
              </FormControl>
              <FormDescription>
                Minimum number of options to select
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`tasks.${index}.maxSelections`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Selections (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? undefined : Number(value));
                  }}
                />
              </FormControl>
              <FormDescription>
                Maximum number of options to select
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
};
