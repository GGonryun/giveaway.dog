'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FieldPath,
  FieldValues,
  UseFormReturn,
  useWatch
} from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { HelpDialog } from '@/components/patterns/help-dialog';
import Link from 'next/link';
import { debounce } from '@giveaway/ui-utils/utils';
import verifySlug from '@/procedures/sweepstakes/verify-slug';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useUnifiedFormLayout } from '@/components/patterns/form-layout/use-unified-form-layout';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { VisibilityType } from '@prisma/client';

export const VisibilityTypeField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => (
  <FormField
    control={form.control}
    name={fieldPath}
    render={({ field }) => (
      <FormItem>
        <div className="flex items-end gap-1">
          <FormLabel>Visibility Type</FormLabel>
          <HelpDialog
            title={'Help: Visibility Type'}
            content={
              <>
                <div>
                  <span className="font-semibold">Private</span> sweepstakes are
                  only accessible to other people within your organization. They
                  will not appear on the public{' '}
                  <Link
                    href="/browse"
                    target="_blank"
                    className="font-bold underline"
                  >
                    browse
                  </Link>{' '}
                  page.
                </div>
                <br />
                <div>
                  <span className="font-semibold">Unlisted</span> sweepstakes
                  can be accessed by anyone with the direct link, but will not
                  appear on the public{' '}
                  <Link
                    href="/browse"
                    target="_blank"
                    className="font-bold underline"
                  >
                    browse
                  </Link>{' '}
                  page.
                </div>
                <br />
                <div>
                  <span className="font-bold">Public</span> sweepstakes will
                  appear on the{' '}
                  <Link
                    href="/browse"
                    target="_blank"
                    className="font-bold underline"
                  >
                    browse
                  </Link>{' '}
                  page and can be discovered and accessed by anyone.
                </div>
              </>
            }
          />
        </div>
        <FormControl>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select visibility type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={VisibilityType.PUBLIC}>Public</SelectItem>
              <SelectItem value={VisibilityType.PRIVATE}>Private</SelectItem>
              <SelectItem value={VisibilityType.UNLISTED}>Unlisted</SelectItem>
            </SelectContent>
          </Select>
        </FormControl>

        <FormMessage />
      </FormItem>
    )}
  />
);

export const UrlSlugField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const { id } = useUnifiedFormLayout();
  const [slugStatus, setSlugStatus] = useState<
    'idle' | 'checking' | 'available' | 'unavailable'
  >('idle');

  const currentSlug = useWatch({
    control: form.control,
    name: fieldPath
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingSlugRef = useRef<string>('');

  const checkSlugRef = useRef(async (slug: string, sweepstakesId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    pendingSlugRef.current = slug;
    abortControllerRef.current = new AbortController();

    try {
      const result = await verifySlug({
        slug,
        currentSweepstakesId: sweepstakesId
      });

      if (!result.ok) {
        setSlugStatus('idle');
        return;
      }

      if (pendingSlugRef.current !== slug) {
        return;
      }

      if (result.data.available) {
        setSlugStatus('available');
      } else {
        setSlugStatus('unavailable');
        form.setError(fieldPath, {
          type: 'manual',
          message: `The slug "${slug}" is already taken. Please choose another one.`
        });
      }
    } catch (error) {
      if (pendingSlugRef.current === slug) {
        setSlugStatus('idle');
      }
    }
  });

  const debouncedVerifySlugRef = useRef(
    debounce((slug: string, sweepstakesId: string) => {
      if (!slug || slug === sweepstakesId) {
        setSlugStatus('idle');
        return;
      }
      setSlugStatus('checking');
      checkSlugRef.current(slug, sweepstakesId);
    }, 500)
  );

  useEffect(() => {
    if (!currentSlug || currentSlug === id) {
      setSlugStatus('idle');
      debouncedVerifySlugRef.current.cancel();
      return;
    }

    if (currentSlug.length < 3) {
      setSlugStatus('idle');
      debouncedVerifySlugRef.current.cancel();
      return;
    }

    if (currentSlug.length > 50) {
      setSlugStatus('idle');
      debouncedVerifySlugRef.current.cancel();
      return;
    }

    debouncedVerifySlugRef.current(currentSlug, id);
  }, [currentSlug, id]);

  useEffect(() => {
    return () => {
      debouncedVerifySlugRef.current.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const state = form.getFieldState(fieldPath);

  return (
    <SwitchBox className={state.error ? 'border-destructive' : ''}>
      <FormField
        control={form.control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem>
            <div className="flex flex-row items-start justify-between">
              <SwitchFormHeader
                label="Custom URL Slug"
                description="Set a custom, memorable URL for your sweepstakes"
                help={{
                  title: 'Help: Custom URL Slug',
                  content: (
                    <div>
                      Choose a <strong>unique and memorable</strong> slug for
                      your sweepstakes URL. This value must be unique across all
                      giveaways on the platform.
                      <br />
                      <br />
                      This will be the web address where participants can find
                      and enter your sweepstakes. For example, if you set the
                      slug to{' '}
                      <span className="font-semibold text-primary">
                        my-awesome-giveaway
                      </span>
                      , the URL will be:
                      <br />
                      <br />
                      https://giveaway.dog/browse/
                      <span className="font-semibold text-primary">
                        my-awesome-giveaway
                      </span>
                    </div>
                  )
                }}
              />
              <FormControl>
                <Switch
                  checked={field.value !== null}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      field.onChange(id);
                    } else {
                      field.onChange(null);
                    }
                  }}
                />
              </FormControl>
            </div>
          </FormItem>
        )}
      />
      <Collapsible open={currentSlug !== null}>
        <CollapsibleContent className="flex flex-col gap-1">
          <FormField
            control={form.control}
            name={fieldPath}
            render={({ field }) => (
              <FormItem>
                <FormControl className="mt-3">
                  <Input {...field} value={field.value || ''} />
                </FormControl>
                {slugStatus === 'checking' && (
                  <FormDescription className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Verifying slug availability...
                  </FormDescription>
                )}
                {slugStatus === 'available' && currentSlug && (
                  <FormDescription className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    The slug &quot;{currentSlug}&quot; is available
                  </FormDescription>
                )}
                {slugStatus === 'idle' && currentSlug && (
                  <FormDescription>
                    Only letters, numbers, and hyphens. Must be unique across
                    all giveaways.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </CollapsibleContent>
      </Collapsible>
    </SwitchBox>
  );
};
