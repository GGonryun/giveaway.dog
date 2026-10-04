import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { useFormContext } from 'react-hook-form';
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

export const AskQuestionFormFields: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

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
      <FormField
        control={form.control}
        name={`tasks.${index}.placeholder`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Placeholder (Optional)</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              Placeholder text for the answer input
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`tasks.${index}.instructions`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Instructions (Optional)</FormLabel>
            <FormControl>
              <Textarea {...field} rows={2} />
            </FormControl>
            <FormDescription>
              Additional instructions or context for the question
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
