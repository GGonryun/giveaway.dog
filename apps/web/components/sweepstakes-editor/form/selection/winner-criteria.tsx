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
import { Switch } from '@/components/ui/switch';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import { HelpDialog } from '@/components/patterns/help-dialog';
import { BotEnforcementField } from '@/lib/user-quality/bot-enforcement-field';

const MinTasksCompletedField = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <FormField
      control={form.control}
      name="criteria.minTasksCompleted"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Minimum Tasks Completed</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              value={field.value}
              onChange={(e) => field.onChange(parseInt(e.target.value))}
            />
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const MinQualityScoreField = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <FormField
      control={form.control}
      name="criteria.minQualityScore"
      render={({ field }) => (
        <FormItem>
          <div className="flex gap-1 items-center">
            <FormLabel>Bot Enforcement</FormLabel>
            <HelpDialog
              title={'Bot Enforcement'}
              content={
                <div className="space-y-3">
                  <p>
                    Control how strictly you want to filter out bots, cheaters,
                    and suspicious accounts from your giveaway. The quality
                    score is a 0-100% rating that helps identify trustworthy
                    participants and filter out potential fraud or bot activity.
                  </p>
                  <div>
                    <p className="font-medium mb-2">Quality Signals:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>
                        <strong>Device Stability</strong>: Consistent device
                        usage
                      </li>
                      <li>
                        <strong>IP Consistency</strong>: Stable IP address
                      </li>
                      <li>
                        <strong>Geo Consistency</strong>: Same region/country
                      </li>
                      <li>
                        <strong>Providers Connected</strong>: Multiple auth
                        providers
                      </li>
                      <li>
                        <strong>Email Verified</strong>: Verified email address
                      </li>
                      <li>
                        <strong>Task Activity</strong>: Recent task completions
                      </li>
                      <li>
                        <strong>Task Diversity</strong>: Variety of tasks
                        completed
                      </li>
                      <li>
                        <strong>Account Age</strong>: Older accounts are more
                        trusted
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Risk Signals:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>
                        <strong>Overlapping IPs</strong>: Sharing IP with other
                        accounts
                      </li>
                      <li>
                        <strong>Overlapping Fingerprints</strong>: Sharing
                        device with other accounts
                      </li>
                    </ul>
                  </div>
                </div>
              }
            />
          </div>
          <FormControl>
            <BotEnforcementField
              value={field.value}
              onChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const AllowMultipleWinsField = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name="criteria.allowMultipleWins"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <SwitchFormHeader
              label="Allow Multiple Wins"
              description="A valid email address is required to enter."
              help={{
                title: 'Help: Require Email',
                content: (
                  <p>
                    Allow the same participant to win multiple prizes if they
                    meet the criteria for each prize. This can be useful for
                    giveaways with multiple prizes or tiers.
                  </p>
                )
              }}
            />
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};

const AllowUserSelectionField = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name="criteria.allowUserSelection"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <SwitchFormHeader
              label="Allow Prize Selection"
              description="Let participants choose which prize they want to compete for."
              help={{
                title: 'Help: Prize Selection',
                content: (
                  <div className="space-y-2">
                    <p>
                      When enabled, participants can choose which specific prize
                      they want to compete for before completing tasks.
                    </p>
                    <p>
                      This is useful when you have multiple prizes with
                      different appeal (e.g., gaming console vs. gift card) and
                      want to let participants self-select their preference.
                    </p>
                    <p>
                      When disabled, winners are randomly assigned prizes from
                      the available pool.
                    </p>
                  </div>
                )
              }}
            />
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};

export const WinnerCriteria = () => {
  return (
    <>
      <MinTasksCompletedField />
      <MinQualityScoreField />
      <AllowMultipleWinsField />
      <AllowUserSelectionField />
    </>
  );
};
