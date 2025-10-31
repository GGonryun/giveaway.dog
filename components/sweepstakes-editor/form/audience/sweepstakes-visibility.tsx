'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
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
import { PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY } from '@/schemas/feature-flags';
import { featureFlags } from '@/lib/feature-flags';
import { debounce } from '@/lib/utils';
import verifySlug from '@/procedures/sweepstakes/verify-slug';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useUnifiedFormLayout } from '@/components/patterns/form-layout/use-unified-form-layout';

const VisibilityTypeField = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const { teamFeatureFlags } = useUnifiedFormLayout();

  const hasPublicSweepstakesAccess = featureFlags.parseTeam(
    teamFeatureFlags,
    PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY
  );
  return (
    <FormField
      control={form.control}
      name="visibility.visibility"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-end gap-1">
            <FormLabel>Visibility Type</FormLabel>
            <HelpDialog
              title={'Help: Visibility Type'}
              content={
                <>
                  <div>
                    <span className="font-semibold">Private</span> sweepstakes
                    are hidden from the{' '}
                    <Link
                      href="/browse"
                      target="_blank"
                      className="font-bold underline"
                    >
                      sweepstakes
                    </Link>{' '}
                    page. Only people with the direct link can access your
                    sweepstakes, giving you more control over who participates.
                  </div>
                  <br />
                  <div>
                    <span className="font-bold">Public</span> sweepstakes can be
                    discovered by anyone on the{' '}
                    <Link
                      href="/browse"
                      target="_blank"
                      className="font-bold underline"
                    >
                      sweepstakes
                    </Link>{' '}
                    page. They are visible to all users and can help you reach a
                    wider audience.
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
                <SelectItem
                  value="PUBLIC"
                  disabled={!hasPublicSweepstakesAccess}
                >
                  Public
                </SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
              </SelectContent>
            </Select>
          </FormControl>
          {!hasPublicSweepstakesAccess && (
            <FormDescription className="text-red-600">
              You do not have permission to make sweepstakes public.{' '}
              <Link
                href="/support"
                className="font-semibold underline hover:text-red-800"
              >
                Contact support
              </Link>{' '}
              to enable this feature for your team.
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const UrlSlugField = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const { id } = useUnifiedFormLayout();
  const [slugStatus, setSlugStatus] = useState<
    'idle' | 'checking' | 'available' | 'unavailable'
  >('idle');

  const currentSlug = useWatch({
    control: form.control,
    name: 'visibility.slug'
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
        form.setError('visibility.slug', {
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

  return (
    <FormField
      control={form.control}
      name="visibility.slug"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-end gap-1">
            <FormLabel>URL Slug</FormLabel>
            <HelpDialog
              title={'Help: URL Slug'}
              content={
                <div>
                  Choose a <strong>unique and memorable</strong> slug for your
                  sweepstakes URL. This value must be unique across all
                  giveaways on the platform.
                  <br />
                  <br />
                  This will be the web address where participants can find and
                  enter your sweepstakes. For example, if you set the slug to{' '}
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
              }
            />
          </div>
          <FormControl>
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
          {slugStatus === 'idle' && (
            <FormDescription>
              Must be unique across all giveaways on the platform
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const SweepstakesVisibility = () => {
  return (
    <>
      <VisibilityTypeField />
      <UrlSlugField />
    </>
  );
};
