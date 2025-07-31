import { ControllerProps, useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '../../schema';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormMessageParagraph
} from '@/components/ui/form';
import { useMemo } from 'react';
import { Switch } from '@/components/ui/switch';
import { SwitchBox, SwitchFormHeader } from '../switch-box';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { RegionalRestrictionFilter } from './regional-restriction-filter';
import { RegionalRestrictionRegions } from './regional-restriction-regions';

export const RegionalRestriction = () => {
  const form = useFormContext<GiveawayFormSchema>();

  const regionalRestriction = form.watch('audience.regionalRestriction');
  const filter = form.getFieldState('audience.regionalRestriction.filter');
  const regions = form.getFieldState('audience.regionalRestriction.regions');

  return (
    <SwitchBox>
      <RegionalRestrictionFormField />

      <Collapsible open={regionalRestriction !== null}>
        <CollapsibleContent className="flex flex-col gap-2">
          <div className="grid grid-cols-[128px_1fr] gap-2 items-start mt-2">
            <RegionalRestrictionFilter />
            <RegionalRestrictionRegions />
          </div>

          <FormMessageParagraph
            error={regions.error ?? filter.error}
            formMessageId={'sub-form-item-message'}
          />
        </CollapsibleContent>
      </Collapsible>
    </SwitchBox>
  );
};

export const RegionalRestrictionFormField = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <FormField
      control={form.control}
      name="audience.regionalRestriction"
      render={regionalRestrictionRender}
    />
  );
};

export const regionalRestrictionRender: ControllerProps<
  GiveawayFormSchema,
  'audience.regionalRestriction'
>['render'] = ({ field }) => {
  const isEnabled = useMemo(() => Boolean(field.value), [field.value]);

  return (
    <FormItem className="flex flex-row items-center justify-between">
      <SwitchFormHeader
        label="Regional Restrictions"
        description="Restrict access to users from certain regions or countries."
        help={{
          title: 'Help: Regional Restrictions',
          content: (
            <p>
              Restrict access to users from certain regions or countries. This
              is useful if your prize is only available in certain areas or if
              you need to comply with local laws and regulations.
            </p>
          )
        }}
      />
      <FormControl>
        <Switch
          checked={isEnabled}
          onClick={() => {
            if (isEnabled) {
              field.onChange(null);
            } else {
              field.onChange({
                regions: [],
                filter: 'include'
              });
            }
          }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};
