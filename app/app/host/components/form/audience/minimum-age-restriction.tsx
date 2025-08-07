import { useFormContext } from 'react-hook-form';
import { DEFAULT_MINIMUM_AGE, GiveawayFormSchema } from '../../../schemas';
import { SwitchBox, SwitchFormHeader } from '../switch-box';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { strings } from '@/lib/strings';
import { Checkbox } from '@/components/ui/checkbox';

export const MinimumAgeRestriction = () => {
  const form = useFormContext<GiveawayFormSchema>();

  const minimumAgeRestriction = form.watch('audience.minimumAgeRestriction');

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name="audience.minimumAgeRestriction"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <SwitchFormHeader
              label="Minimum Age Restriction"
              description="Set a minimum age requirement for participants."
              help={{
                title: 'Help: Minimum Age Restriction',
                content: (
                  <p>
                    Ask users to confirm their age before they can enter the
                    giveaway. This is useful for giveaways that have age
                    restrictions due to legal or content reasons.
                  </p>
                )
              }}
            />

            <FormControl>
              <Switch
                checked={Boolean(field.value)}
                onCheckedChange={() => {
                  if (Boolean(field.value)) {
                    return field.onChange(null);
                  } else {
                    return field.onChange({
                      value: DEFAULT_MINIMUM_AGE,
                      format: 'checkbox',
                      label: `I am at least ${DEFAULT_MINIMUM_AGE} years of age (required)`,
                      required: true
                    });
                  }
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <Collapsible open={minimumAgeRestriction !== null}>
        <CollapsibleContent className="flex flex-col gap-1">
          <div className="grid grid-cols-1 sm:grid-cols-[159px_1fr] gap-2 items-start mt-2">
            <AgeField />
            <FormatField />
          </div>
          <LabelField />
          <div className="mt-3 mb-1">
            <RequiredField />
          </div>
        </CollapsibleContent>
      </Collapsible>
      <FormMessage />
    </SwitchBox>
  );
};

const AgeField = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <FormField
      control={form.control}
      name="audience.minimumAgeRestriction.value"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Age</FormLabel>
          <FormControl>
            <Input
              placeholder="13"
              type="number"
              value={field.value ?? DEFAULT_MINIMUM_AGE}
              onChange={(v) => {
                const n = Number(v.target.value);
                if (n < 0) {
                  return;
                }
                const label = form.getValues(
                  'audience.minimumAgeRestriction.label'
                );
                const oldAge = form.getValues(
                  'audience.minimumAgeRestriction.value'
                );

                form.setValue(
                  'audience.minimumAgeRestriction.label',
                  strings.replace(label, oldAge, n)
                );

                field.onChange(n);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const FormatField = () => {
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name="audience.minimumAgeRestriction.format"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Format</FormLabel>
          <FormControl>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Checkbox" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const LabelField = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <FormField
      control={form.control}
      name="audience.minimumAgeRestriction.label"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input value={field.value} onChange={field.onChange} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const RequiredField = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <FormField
      control={form.control}
      name="audience.minimumAgeRestriction.required"
      render={({ field }) => (
        <FormItem className="flex items-center gap-2">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked)}
            />
          </FormControl>
          <FormLabel className="cursor-pointer pb-[2px]">Required</FormLabel>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
