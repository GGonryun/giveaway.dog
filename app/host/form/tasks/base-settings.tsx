import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '../../schema';
import { useArrayContext } from '@/components/hooks/use-array-context';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export const BaseSettings: React.FC = () => {
  const { index } = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <div>
      <div className="grid grid-cols-[1fr_96px] gap-2">
        <FormField
          control={form.control}
          name={`tasks.${index}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Title"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`tasks.${index}.value`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <Input
                  placeholder="Value"
                  type="number"
                  value={field.value}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (isNaN(v)) {
                      return field.onChange(0);
                    }
                    if (v < 0) {
                      return field.onChange(0);
                    }
                    return field.onChange(v);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
