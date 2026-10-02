'use client';

import { useArrayContext } from '@/components/hooks/use-array-context';
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel
} from '@/components/ui/form';
import { Typography } from '@/components/ui/typography';
import { assertNever } from '@/lib/errors';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SecretCodeCaseSensitiveFormField } from './additional-settings/lib/secret-code-case-sensitive';
import { TwitterVerifiedBonusField } from './additional-settings/lib/twitter-verified-bonus';
import { RequireProofField } from './additional-settings/lib/require-proof';
import { TaskType } from '../../schemas';

export const AdvancedSettings: React.FC<{ type: TaskType }> = ({ type }) => {
  const content = useCallback(() => {
    switch (type) {
      case 'SECRET_CODE':
      case 'SECRET_CODE_V2':
        return (
          <>
            <SecretCodeCaseSensitiveFormField />
            <MandatoryField />
            <TasksRequiredField />
          </>
        );

      case 'VISIT_URL':
        return (
          <>
            <MandatoryField />
            <TasksRequiredField />
            <AfterVisitField />
          </>
        );
      case 'TWITTER_FOLLOW':
      case 'TWITTER_RETWEET':
      case 'TWITTER_LIKE':
      case 'TIKTOK_FOLLOW':
      case 'TIKTOK_LIKE':
        return (
          <>
            <MandatoryField />
            <TasksRequiredField />
            <RequireConnectionField />
          </>
        );
      case 'STEAM_FOLLOW':
        return (
          <>
            <RequireProofField />
            <RequireConnectionField />
            <MandatoryField />
            <TasksRequiredField />
          </>
        );
      case 'FACEBOOK_VIEW_POST':
      case 'FACEBOOK_VISIT_PAGE':
      case 'INSTAGRAM_VISIT':
      case 'INSTAGRAM_LIKE':
      case 'INSTAGRAM_COMMENT':
      case 'TWITTER_CONNECT':
      case 'STEAM_WISHLIST':
      case 'DISCORD_JOIN':
      case 'TWITCH_FOLLOW':
      case 'KICK_FOLLOW':
      case 'YOUTUBE_VISIT':
      case 'BONUS_TIMED':
      case 'BONUS_TASK':
      case 'BONUS_COMPLETE_PROFILE':
      case 'BONUS_LIMITED':
      case 'BONUS_LOYALTY':
      case 'BLUESKY_CONNECT':
      case 'BLUESKY_FOLLOW':
      case 'BLUESKY_LIKE':
      case 'BLUESKY_REPOST':
      case 'VELORA_CONNECT':
      case 'LINKEDIN_CONNECT':
      case 'LINKEDIN_FOLLOW':
      case 'VELORA_FOLLOW':
      case 'ASK_QUESTION':
      case 'SINGLE_CHOICE':
      case 'MULTIPLE_CHOICE':
        return (
          <>
            <MandatoryField />
            <TasksRequiredField />
          </>
        );
      case 'TWITTER_RETWEET_IMPORT':
      case 'TWITTER_LIKE_IMPORT':
        return (
          <>
            <TwitterVerifiedBonusField />
          </>
        );
      case 'TWITTER_RETWEET_IMPORT_V2':
      case 'REFERRAL_LINK':
      case 'BLUESKY_LIKE_IMPORT':
      case 'BLUESKY_REPOST_IMPORT':
      case 'DISCORD_INTERACTION_IMPORT':
      case 'TWITCH_CHAT_IMPORT':
      case 'SUBMIT_MEDIA':
        return null;
      default:
        throw assertNever(type);
    }
  }, []);

  const show = content();

  if (!show) {
    return null;
  }

  return (
    <div className="space-y-1">
      <AdvancedLabel />
      <div className="space-y-2">{show}</div>
    </div>
  );
};

const AdvancedLabel: React.FC = () => {
  return <Typography.Paragraph weight="medium">Advanced</Typography.Paragraph>;
};

const MandatoryField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name={`tasks.${index}.mandatory`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Mandatory"
              description="Users must complete this task to access non-mandatory tasks"
              help={{
                title: 'Help: Mandatory Tasks',
                content: (
                  <p>
                    Mandatory tasks can be used to gate access to other tasks.
                    These should usually be tasks that are required for the
                    giveaway, such as following on social media or subscribing
                    to a newsletter.
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

const TasksRequiredField: React.FC = () => {
  const index = useArrayContext();
  const { control } = useFormContext<GiveawayFormSchema>();
  const tasks = useWatch({
    control,
    name: 'tasks'
  });

  if (tasks.length <= 1) {
    return null;
  }

  return (
    <SwitchBox>
      <FormField
        control={control}
        name={`tasks.${index}.tasksRequired`}
        render={({ field }) => (
          <FormItem className="grid grid-cols-[1fr_80px] gap-2 items-center">
            <SwitchFormHeader
              label="Tasks Required"
              description="Locked until this many other tasks are completed"
              help={{
                title: 'Help: Tasks Required',
                content: (
                  <p>
                    Task requirements can be used to lock this task until a
                    certain number of other tasks are completed.
                  </p>
                )
              }}
            />
            <FormControl>
              <Input
                type="number"
                value={String(field.value ?? 0)}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (isNaN(value) || value < 0) {
                    field.onChange(0);
                  } else {
                    field.onChange(value);
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};

const AfterVisitField: React.FC = () => {
  const index = useArrayContext();
  const { control, setValue } = useFormContext<GiveawayFormSchema>();

  const afterVisit = useWatch({
    control,
    name: `tasks.${index}.afterVisit`
  });

  const selectedType = afterVisit?.type ?? 'INSTANT';

  const handleTypeChange = (type: 'INSTANT' | 'DELAY' | 'QUESTION') => {
    if (type === 'INSTANT') {
      setValue(`tasks.${index}.afterVisit`, undefined);
    } else if (type === 'DELAY') {
      setValue(`tasks.${index}.afterVisit`, {
        type: 'DELAY',
        seconds: 10
      });
    } else if (type === 'QUESTION') {
      setValue(`tasks.${index}.afterVisit`, {
        type: 'QUESTION',
        question: '',
        input: 'TEXT'
      });
    }
  };

  return (
    <SwitchBox>
      <FormField
        control={control}
        name={`tasks.${index}.afterVisit`}
        render={() => (
          <div className="space-y-4">
            <SwitchFormHeader
              label="After Visiting"
              description="Customize what happens after the user visits the URL"
              help={{
                title: 'Help: After Visit',
                content: (
                  <div className="space-y-2">
                    <p>
                      Control what happens after users click the visit button:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        <strong>Reward Immediately:</strong> Task completes
                        instantly when the visit button is clicked.
                      </li>
                      <li>
                        <strong>Delay the Reward:</strong> Add a countdown timer
                        before the task can be completed, ensuring users spend
                        time on the page.
                      </li>
                      <li>
                        <strong>Ask a Question:</strong> Require users to answer
                        a question about the visited content to verify they
                        engaged with it.
                      </li>
                    </ul>
                  </div>
                )
              }}
            />

            <RadioGroup
              className="mt-2"
              value={selectedType}
              onValueChange={handleTypeChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="INSTANT" id="instant" />
                <Label htmlFor="instant" className="cursor-pointer">
                  Reward immediately
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DELAY" id="delay" />
                <Label htmlFor="delay" className="cursor-pointer">
                  Delay the reward
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="QUESTION" id="question" />
                <Label htmlFor="question" className="cursor-pointer">
                  Ask a question
                </Label>
              </div>
            </RadioGroup>

            {selectedType === 'DELAY' && (
              <FormField
                control={control}
                name={`tasks.${index}.afterVisit.seconds`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delay (seconds)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={300}
                        value={field.value ?? 5}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (!isNaN(value)) {
                            field.onChange(value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedType === 'QUESTION' && (
              <div className="space-y-4">
                <FormField
                  control={control}
                  name={`tasks.${index}.afterVisit.question`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question</FormLabel>

                      <FormControl>
                        <Input
                          placeholder="e.g., What is the main color of the website?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        )}
      />
    </SwitchBox>
  );
};

const RequireConnectionField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name={`tasks.${index}.validation`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Require Connection"
              description="Users must connect their account in order to complete this task"
              help={{
                title: 'Help: Require Connection',
                content: (
                  <p>
                    When enabled, users must connect their Twitter account.
                    Twitter API limits prevent us from validating
                    follows/retweets even with a connected account. Having a
                    connected account gives you the ability to manually verify
                    entries if needed.
                  </p>
                )
              }}
            />
            <FormControl>
              <Switch
                checked={field.value?.type !== 'NONE'}
                onCheckedChange={(checked) => {
                  if (checked) {
                    field.onChange({ type: 'STRICT' });
                  } else {
                    field.onChange({ type: 'NONE' });
                  }
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};
