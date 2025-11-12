'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { PickerFormSchema } from '@/lib/pickers/schemas/form';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { UnifiedSectionHeader } from '@/components/patterns/form-layout/section-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { PickerActionDisplay } from '../picker-action-display';

export const ActionsSection = () => {
  const { trigger, clearErrors, formState, control } =
    useFormContext<PickerFormSchema>();

  const actions = useWatch({
    control,
    name: 'actions'
  });

  useEffect(() => {
    if (actions.like || actions.repost || actions.quote || actions.reply) {
      clearErrors('actions');
    } else {
      trigger('actions');
    }
  }, [actions, clearErrors, trigger]);

  return (
    <>
      <UnifiedSectionHeader
        className="border-t"
        label="Actions"
        description="Configure the actions participants must complete to enter the picker"
      >
        <div className="space-y-1.5">
          <div className="flex gap-0">
            <FormField
              control={control}
              name="actions.like"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Button
                      type="button"
                      variant={field.value ? 'default' : 'outline'}
                      className={cn(
                        'w-full rounded-r-none border-r-0',
                        field.value && 'border-r'
                      )}
                      onClick={() => field.onChange(!field.value)}
                    >
                      <PickerActionDisplay action="like" />
                    </Button>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="actions.repost"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Button
                      type="button"
                      variant={field.value ? 'default' : 'outline'}
                      className={cn(
                        'w-full rounded-none border-r-0',
                        field.value && 'border-r'
                      )}
                      onClick={() => field.onChange(!field.value)}
                    >
                      <PickerActionDisplay action="repost" />
                    </Button>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="actions.quote"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Button
                      type="button"
                      variant={field.value ? 'default' : 'outline'}
                      className={cn(
                        'w-full rounded-none border-r-0',
                        field.value && 'border-r'
                      )}
                      onClick={() => field.onChange(!field.value)}
                    >
                      <PickerActionDisplay action="quote" />
                    </Button>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="actions.reply"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Button
                      type="button"
                      variant={field.value ? 'default' : 'outline'}
                      className="w-full rounded-l-none"
                      onClick={() => field.onChange(!field.value)}
                    >
                      <PickerActionDisplay action="reply" />
                    </Button>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          {formState.errors?.actions?.message && (
            <p className="text-sm font-medium text-destructive">
              {formState.errors.actions.message}
            </p>
          )}
        </div>
      </UnifiedSectionHeader>
    </>
  );
};
