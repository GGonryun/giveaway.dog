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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@giveaway/ui-primitives/select';
import { MinimalTiptap } from '@giveaway/ui-rich-text/minimal-tiptap-editor';
import { HelpDialog } from '@giveaway/ui-layouts/help-dialog';

export const SubmitMediaFormFields: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <>
      <FormField
        control={form.control}
        name={`tasks.${index}.acceptedTypes`}
        render={({ field }) => (
          <FormItem>
            <div className="flex gap-1 items-center">
              <FormLabel>Media Type</FormLabel>
              <HelpDialog
                title="Accepted Image Formats"
                content={
                  <div className="space-y-2">
                    <div>
                      <strong>Accepted formats:</strong> GIF, JPEG, PNG, WEBP
                    </div>
                    <div>
                      <strong>Maximum size:</strong> 3MB
                    </div>
                    <div>
                      <strong>Verification:</strong> All submissions require
                      manual review
                    </div>
                  </div>
                }
              />
            </div>
            <FormControl>
              <Select
                value={field.value?.[0] || 'IMAGE'}
                onValueChange={(value) => field.onChange([value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select media type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMAGE">Image</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              Type of media participants can submit
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`tasks.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Task Description</FormLabel>
            <FormControl>
              <MinimalTiptap
                content={field.value}
                onChange={field.onChange}
                placeholder="Enter a description for this task"
              />
            </FormControl>
            <FormDescription>
              Provide instructions for participants about what media to submit
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
