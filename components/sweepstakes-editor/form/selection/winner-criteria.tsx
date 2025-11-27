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
import { EXPERIMENTAL_VALIDATION_FEATURE_FLAG_KEY } from '@/schemas/feature-flags';

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
          <FormLabel>Minimum Quality Score (%)</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={0}
              max={100}
              value={isNaN(field.value) ? 0 : field.value}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                return field.onChange(isNaN(v) ? 0 : v);
              }}
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

const AllowedUserSourcesField = () => {
  const { teamFeatureFlags } = useUnifiedFormLayout();
  const form = useFormContext<GiveawayFormSchema>();

  const allowedUserSources = useWatch({
    control: form.control,
    name: 'criteria.externalPlatforms'
  });

  const hasExperimentalValidation = featureFlags.parseTeam(
    teamFeatureFlags,
    EXPERIMENTAL_VALIDATION_FEATURE_FLAG_KEY
  );

  if (!hasExperimentalValidation) {
    return null;
  }

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name="criteria.externalPlatforms"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Allow External Users"
              description="Allow users from external platforms to be eligible to win prizes."
              help={{
                title: 'Help: Allow External Users',
                content: (
                  <div>
                    <p>
                      Specify which participant sources are eligible to win
                      prizes in this giveaway. Depending on your giveaway setup,
                      you might want to restrict winners to certain sources
                      only.
                    </p>
                    <br />
                    <p>
                      Depending on your tasks, we automatically import users
                      from external platforms like X or Discord. Use this
                      setting to control whether those users can win prizes.
                    </p>
                  </div>
                )
              }}
            />

            <FormControl>
              <Switch
                checked={Boolean(field.value)}
                onCheckedChange={() => {
                  if (Boolean(field.value)) {
                    return field.onChange(null);
                  } else {
                    return field.onChange(DEFAULT_ALLOWED_USER_SOURCES);
                  }
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <Collapsible open={Boolean(allowedUserSources)}>
        <CollapsibleContent className="flex flex-col gap-1">
          <CheckboxGroupField />
        </CollapsibleContent>
      </Collapsible>
      <FormMessage />
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
      <AllowedUserSourcesField />
    </>
  );
};
