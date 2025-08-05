'use client';

import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { GiveawayFormSchema } from '../../schema';

import React from 'react';
import { Section } from '../section';
import { Textarea } from '@/components/ui/textarea';
import { TermsAndConditions } from './terms';

export const Setup = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <Section
      label="Setup"
      description="Choose the details of your giveaway."
      fields={['setup']}
    >
      <FormField
        control={form.control}
        name="setup.name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter a name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="setup.description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea rows={4} placeholder="Enter a description" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <TermsAndConditions />
    </Section>
  );
};
