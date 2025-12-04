'use client';

import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { DEFAULT_ALLOWED_USER_SOURCES } from '@/schemas/giveaway/defaults';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { widetype } from '@/lib/widetype';
import {
  USER_SOURCE_COMING_SOON,
  USER_SOURCE_DESCRIPTION,
  USER_SOURCE_LABEL,
  USER_SOURCE_MANAGEABLE
} from '@/lib/user-source/data';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useUnifiedFormLayout } from '@/components/patterns/form-layout/use-unified-form-layout';
import { featureFlags } from '@/lib/feature-flags';
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

const CheckboxGroupField = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <FormField
      control={form.control}
      name="criteria.externalPlatforms"
      render={({ field }) => (
        <FormItem>
          <div className="space-y-1 mt-2">
            {widetype
              .entries(USER_SOURCE_LABEL)
              .filter(([key]) => USER_SOURCE_MANAGEABLE[key])
              .map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex gap-2 items-center py-0.5">
                        <Checkbox
                          id={`source-${key}`}
                          checked={field.value?.includes(key) ?? false}
                          disabled={USER_SOURCE_COMING_SOON[key]}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, key]);
                            } else {
                              field.onChange(
                                currentValue.filter((v) => v !== key)
                              );
                            }
                          }}
                        />
                        <Label htmlFor={`source-${key}`}>{value}</Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center">
                      {USER_SOURCE_COMING_SOON[key]
                        ? 'Coming Soon'
                        : USER_SOURCE_DESCRIPTION[key]}
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const WinnerCriteria = () => {
  return (
    <>
      <MinTasksCompletedField />
      <MinQualityScoreField />
      <AllowMultipleWinsField />
    </>
  );
};
