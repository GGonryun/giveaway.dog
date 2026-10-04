import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon } from 'lucide-react';

export const SingleChoiceFormFields: React.FC = () => {
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
    </>
  );
};
