import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useArrayContext } from '@/components/hooks/use-array-context';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

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
            <FormLabel>Media Type</FormLabel>
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

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>Accepted formats:</strong> GIF, JPEG, PNG, WEBP
          <br />
          <strong>Maximum size:</strong> 3MB
          <br />
          <strong>Verification:</strong> All submissions require manual review
        </AlertDescription>
      </Alert>
    </>
  );
};
