'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { PickerFormSchema } from '@/lib/pickers/schemas/form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import { UnifiedSectionHeader } from '@/components/patterns/form-layout/section-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heart, Repeat2, Quote, MessageSquare } from 'lucide-react';
import { useEffect } from 'react';

export const ActionsSection = () => {
  const { trigger, clearErrors, formState, control } =
    useFormContext<PickerFormSchema>();

  const actions = useWatch({
    control,
    name: 'actions'
  });

  useEffect(() => {
    if (actions.like || actions.retweet || actions.quote || actions.reply) {
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
                      <Heart className="h-4 w-4 mr-2" />
                      Like
                    </Button>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="actions.retweet"
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
                      <Repeat2 className="h-4 w-4 mr-2" />
                      Retweet
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
                      <Quote className="h-4 w-4 mr-2" />
                      Quote
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
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Reply
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
