import { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';
import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import { Button } from '@giveaway/ui-primitives/button';
import { PlusIcon, TrashIcon } from 'lucide-react';
import { HelpDialog } from '@giveaway/ui-layouts/help-dialog';
import { useEffect } from 'react';

const MAX_CODES = 10;

export const SecretCodesFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  const codes = (form.watch(`tasks.${index}.codes` as any) as string[]) || [];

  const codesError = (form.formState.errors?.tasks?.[index] as any)?.codes;

  useEffect(() => {
    if (!codesError) return;
    const allCodesFilled = codes.every((code) => code && code.trim() !== '');
    if (allCodesFilled) {
      form.clearErrors(`tasks.${index}.codes` as any);
    }
  }, [codes, codesError, form, index]);

  const addCode = () => {
    form.setValue(`tasks.${index}.codes` as any, [...codes, '']);
  };

  const removeCode = (codeIndex: number) => {
    form.setValue(
      `tasks.${index}.codes` as any,
      codes.filter((_, i) => i !== codeIndex)
    );
  };

  const canAddMore = codes.length < MAX_CODES;

  return (
    <div>
      <div className="flex items-center gap-1">
        <FormLabel>Codes</FormLabel>
        <HelpDialog
          title="Multiple Secret Codes"
          content="Add multiple secret codes that participants can use. Any of these codes will be accepted as a valid answer."
        />
      </div>
      <div className="space-y-2 mt-0.5">
        {codes.map((_, codeIndex) => (
          <div key={codeIndex} className="flex gap-2">
            <FormField
              control={form.control}
              name={`tasks.${index}.codes.${codeIndex}` as any}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input {...field} placeholder={`Code ${codeIndex + 1}`} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeCode(codeIndex)}
              disabled={codes.length <= 1}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <FormField
        control={form.control}
        name={`tasks.${index}.codes` as any}
        render={() => (
          <FormItem>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCode}
              disabled={!canAddMore}
              className="w-full mt-2"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add another code ({codes.length}/{MAX_CODES})
            </Button>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
