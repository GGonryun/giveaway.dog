import { UnifiedSectionHeader } from '@/components/patterns/form-layout/section-header';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import {
  FormField,
  FormItem,
  FormControl
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { PickerFormSchema } from '@/lib/pickers/schemas/form';
import { useFormContext } from 'react-hook-form';

export const RequirementsSection: React.FC = () => {
  const { control } = useFormContext<PickerFormSchema>();

  return (
    <UnifiedSectionHeader
      className="border-t"
      label="Requirements"
      description="Set profile requirements for users to be eligible for the picker"
    >
      <div className="space-y-4">
        <SwitchBox>
          <FormField
            control={control}
            name="requirements.hasProfileImage"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <SwitchFormHeader
                  label="Profile Image"
                  description="Require users to have a profile image."
                />

                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </SwitchBox>

        <SwitchBox>
          <FormField
            control={control}
            name="requirements.hasBanner"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <SwitchFormHeader
                  label="Banner Image"
                  description="Require users to have a banner image"
                />

                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </SwitchBox>

        <SwitchBox>
          <FormField
            control={control}
            name="requirements.hasLocation"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <SwitchFormHeader
                  label="Location"
                  description="Require users to have location set"
                />
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </SwitchBox>

        <SwitchBox>
          <FormField
            control={control}
            name="requirements.hasDescription"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <SwitchFormHeader
                  label="Bio/Description"
                  description="Require users to have a bio"
                />
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </SwitchBox>
      </div>
    </UnifiedSectionHeader>
  );
};
