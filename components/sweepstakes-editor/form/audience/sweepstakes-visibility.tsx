'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
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
import { useSweepstakes } from '../../hooks/use-sweepstake-step';

const VisibilityTypeField = () => {
  const form = useFormContext<GiveawayFormSchema>();

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
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
              </SelectContent>
            </Select>
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const UrlSlugField = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const { id } = useSweepstakes();

  return (
    <FormField
      control={form.control}
      name="visibility.url"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-end gap-1">
            <FormLabel>Custom URL Slug</FormLabel>
            <HelpDialog
              title={'Help: Custom Slug'}
              content={
                <div>
                  Choose a unique and memorable slug for your sweepstakes URL.
                  This will be the web address where participants can find and
                  enter your sweepstakes. For example, if you set the slug to
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
            <Input value={field.value || id} onChange={field.onChange} />
          </FormControl>
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
