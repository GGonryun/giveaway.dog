'use client';

import { Textarea } from '@giveaway/ui-primitives/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@giveaway/ui-primitives/select';
import { FileUpload } from '@giveaway/ui-file-upload/file-upload';
import { Switch } from '@giveaway/ui-primitives/switch';
import {
  SwitchBox,
  SwitchFormHeader
} from '@giveaway/ui-layouts/form-layout/switch-form-header';
import { SocialBlueskyIcon } from '@giveaway/integration-icons/bluesky-icon';
import { IntegrationsSchema } from '@giveaway/integration-model/schemas';
import { useFormContext } from 'react-hook-form';
import { PostToBlueskyRequestSchema } from '@giveaway/automation-model/schemas';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { cn } from '@giveaway/ui-utils/utils';
import { useState } from 'react';
import { BlueskyPostPermissionBanner } from '../bluesky-post-permission-banner';
import { FileSize } from '@giveaway/util-media/files';

interface BlueskyContentStepProps {
  integrations: IntegrationsSchema;
  isSubmitting: boolean;
  hasBlueskyIntegration: boolean;
  hasPostingPermission: boolean;
  slug: string;
}

export function BlueskyContentStep({
  integrations,
  isSubmitting,
  hasBlueskyIntegration,
  hasPostingPermission,
  slug
}: BlueskyContentStepProps) {
  const form = useFormContext<PostToBlueskyRequestSchema>();

  const postText = form.watch('text');
  const tasks = form.watch('tasks');
  const imageUrl = form.watch('imageUrl');

  const [showImageUpload, setShowImageUpload] = useState(!!imageUrl);

  const characterCount = postText?.length || 0;
  const isOverLimit = characterCount > 300;

  const getCharacterCountColor = () => {
    if (characterCount <= 280) return 'text-green-600';
    if (characterCount <= 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  const hasTaskType = (type: 'BLUESKY_REPOST' | 'BLUESKY_LIKE') => {
    const taskLiteral = type === 'BLUESKY_REPOST' ? 'REPOST' : 'LIKE';
    return tasks.includes(taskLiteral);
  };

  const toggleTask = (type: 'BLUESKY_REPOST' | 'BLUESKY_LIKE') => {
    const taskLiteral = type === 'BLUESKY_REPOST' ? 'REPOST' : 'LIKE';

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
      <BlueskyPostPermissionBanner
        hasBlueskyIntegration={hasBlueskyIntegration}
        hasPostingPermission={hasPostingPermission}
        slug={slug}
      />

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
                      <SocialBlueskyIcon className="h-4 w-4" />
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
              <FormLabel>Post Content</FormLabel>
              <span
                className={cn(`text-sm font-medium`, getCharacterCountColor())}
              >
                {characterCount}/300
              </span>
            </div>
            <FormControl>
              <Textarea {...field} rows={8} className="text-sm" />
            </FormControl>
            {isOverLimit && (
              <p className="text-sm text-red-600">
                Post exceeds 300 character limit
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
              description="Include an image with your post"
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
                      maxSize={new FileSize(976.56, 'KB')}
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
                description="Automatically create a repost task for this post"
              />
              <Switch
                checked={hasTaskType('BLUESKY_REPOST')}
                onCheckedChange={() => toggleTask('BLUESKY_REPOST')}
                disabled={isSubmitting}
              />
            </div>
          </SwitchBox>

          <SwitchBox>
            <div className="flex flex-row items-start justify-between">
              <SwitchFormHeader
                label='Add "Like" task'
                description="Automatically create a like task for this post"
              />
              <Switch
                checked={hasTaskType('BLUESKY_LIKE')}
                onCheckedChange={() => toggleTask('BLUESKY_LIKE')}
                disabled={isSubmitting}
              />
            </div>
          </SwitchBox>
        </div>
      </div>
    </div>
  );
}
