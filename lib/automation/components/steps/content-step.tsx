'use client';

import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { Switch } from '@/components/ui/switch';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { IntegrationsSchema } from '@/lib/integrations/schemas';
import { useFormContext } from 'react-hook-form';
import { PostToTwitterRequestSchema } from '../../schemas';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AutomatedPostContentStepProps {
  integrations: IntegrationsSchema;
  isSubmitting: boolean;
}

export function AutomatedPostContentStep({
  integrations,
  isSubmitting
}: AutomatedPostContentStepProps) {
  const form = useFormContext<PostToTwitterRequestSchema>();

  const tweetText = form.watch('text');
  const tasks = form.watch('tasks');
  const imageUrl = form.watch('imageUrl');

  const [showImageUpload, setShowImageUpload] = useState(!!imageUrl);

  const characterCount = tweetText?.length || 0;
  const isOverLimit = characterCount > 280;

  const getCharacterCountColor = () => {
    if (characterCount <= 260) return 'text-green-600';
    if (characterCount <= 280) return 'text-yellow-600';
    return 'text-red-600';
  };

  const hasTaskType = (type: 'TWITTER_RETWEET' | 'TWITTER_LIKE') => {
    const taskLiteral = type === 'TWITTER_RETWEET' ? 'REPOST' : 'LIKE';
    return tasks.includes(taskLiteral);
  };

  const toggleTask = (type: 'TWITTER_RETWEET' | 'TWITTER_LIKE') => {
    const taskLiteral = type === 'TWITTER_RETWEET' ? 'REPOST' : 'LIKE';

    if (tasks.includes(taskLiteral)) {
      form.setValue(
        'tasks',
        tasks.filter((t) => t !== taskLiteral)
      );
    } else {
      form.setValue('tasks', [...tasks, taskLiteral]);
    }
  };

  return (
    <div className="space-y-4 px-4">
      <FormField
        control={form.control}
        name="integrationId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Post as</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select your account" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {integrations.map((integration) => (
                  <SelectItem key={integration.id} value={integration.id}>
                    <div className="flex items-center gap-2">
                      <SocialXIcon className="h-4 w-4" />
                      {integration.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="text"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Tweet Content</FormLabel>
              <span
                className={cn(`text-sm font-medium`, getCharacterCountColor())}
              >
                {characterCount}/280
              </span>
            </div>
            <FormControl>
              <Textarea {...field} rows={8} className="text-sm" />
            </FormControl>
            {isOverLimit && (
              <p className="text-sm text-red-600">
                Tweet exceeds 280 character limit
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <SwitchBox>
        <div className="space-y-3">
          <div className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Add an image"
              description="Include an image with your tweet"
            />
            <Switch
              checked={showImageUpload}
              onCheckedChange={(checked) => {
                setShowImageUpload(checked);
                if (!checked) {
                  form.setValue('imageUrl', undefined);
                }
              }}
              disabled={isSubmitting}
            />
          </div>
          {showImageUpload && (
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FileUpload
                      onUpload={field.onChange}
                      initialUrl={field.value}
                      size="wide"
                      fillPreview
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </SwitchBox>

      <div>
        <FormLabel className="text-sm font-medium mb-1 block">
          Automatically add tasks
        </FormLabel>
        <div className="space-y-2">
          <SwitchBox>
            <div className="flex flex-row items-start justify-between">
              <SwitchFormHeader
                label='Add "Repost" task'
                description="Automatically create a repost task for this tweet"
              />
              <Switch
                checked={hasTaskType('TWITTER_RETWEET')}
                onCheckedChange={() => toggleTask('TWITTER_RETWEET')}
                disabled={isSubmitting}
              />
            </div>
          </SwitchBox>

          <SwitchBox>
            <div className="flex flex-row items-start justify-between">
              <SwitchFormHeader
                label='Add "Like" task'
                description="Automatically create a like task for this tweet"
              />
              <Switch
                checked={hasTaskType('TWITTER_LIKE')}
                onCheckedChange={() => toggleTask('TWITTER_LIKE')}
                disabled={isSubmitting}
              />
            </div>
          </SwitchBox>
        </div>
      </div>
    </div>
  );
}
