'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@giveaway/ui-primitives/select';
import { Switch } from '@giveaway/ui-primitives/switch';
import { Checkbox } from '@giveaway/ui-primitives/checkbox';
import {
  SwitchBox,
  SwitchFormHeader
} from '@giveaway/ui-layouts/form-layout/switch-form-header';
import { SocialDiscordIcon } from '@giveaway/integration-icons/discord-icon';
import { IntegrationsSchema } from '@giveaway/integration-model/schemas';
import { useFormContext, useWatch } from 'react-hook-form';
import { PostToDiscordRequestSchema } from '@giveaway/automation-model/schemas';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from '@giveaway/ui-primitives/form';
import { DiscordPostPermissionBanner } from '../discord-post-permission-banner';
import { useState, useEffect } from 'react';
import { getDiscordRoles } from '@/lib/discord/procedures/get-discord-roles';
import { getDiscordChannels } from '@/lib/discord/procedures/get-discord-channels';

interface Role {
  id: string;
  name: string;
  color: number;
  position: number;
}

interface Channel {
  id: string;
  name: string;
}

interface DiscordContentStepProps {
  integrations: IntegrationsSchema;
  isSubmitting: boolean;
  hasDiscordIntegration: boolean;
  slug: string;
}

export function DiscordContentStep({
  integrations,
  isSubmitting,
  hasDiscordIntegration,
  slug
}: DiscordContentStepProps) {
  const form = useFormContext<PostToDiscordRequestSchema>();

  const tasks = form.watch('tasks');
  const integrationId = useWatch({
    control: form.control,
    name: 'integrationId'
  });
  const selectedRoles =
    useWatch({
      control: form.control,
      name: 'roles'
    }) || [];

  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  const hasInteractionTask = tasks.includes('INTERACTION');

  const toggleInteractionTask = () => {
    if (hasInteractionTask) {
      form.setValue('tasks', []);
      form.setValue('roles', []);
    } else {
      form.setValue('tasks', ['INTERACTION']);
    }
  };

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    const currentRoles = form.getValues('roles') || [];
    const newRoles = checked
      ? [...currentRoles, roleId]
      : currentRoles.filter((id) => id !== roleId);
    form.setValue('roles', newRoles);
  };

  useEffect(() => {
    async function loadChannels() {
      if (!integrationId) {
        setChannels([]);
        return;
      }

      setLoadingChannels(true);
      try {
        const result = await getDiscordChannels({
          slug,
          integrationId
        });
        if (result.ok) {
          setChannels(result.data.channels);
        } else {
          console.error('Failed to load Discord channels:', result.data);
          setChannels([]);
        }
      } catch (error) {
        console.error('Failed to load Discord channels:', error);
        setChannels([]);
      } finally {
        setLoadingChannels(false);
      }
    }

    loadChannels();
  }, [integrationId, slug]);

  useEffect(() => {
    async function loadRoles() {
      if (!integrationId || !hasInteractionTask) {
        setRoles([]);
        return;
      }

      setLoadingRoles(true);
      try {
        const result = await getDiscordRoles({
          slug,
          integrationId
        });
        if (result.ok) {
          setRoles(result.data.roles);
        } else {
          console.error('Failed to load Discord roles:', result.data);
          setRoles([]);
        }
      } catch (error) {
        console.error('Failed to load Discord roles:', error);
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    }

    loadRoles();
  }, [integrationId, hasInteractionTask, slug]);

  return (
    <div className="space-y-4 px-4">
      <DiscordPostPermissionBanner
        hasDiscordIntegration={hasDiscordIntegration}
        slug={slug}
      />

      <FormField
        control={form.control}
        name="integrationId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Post to Discord server</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select your server" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {integrations.map((integration) => (
                  <SelectItem key={integration.id} value={integration.id}>
                    <div className="flex items-center gap-2">
                      <SocialDiscordIcon className="h-4 w-4" />
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
        name="channelId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Channel</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={!integrationId || loadingChannels}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingChannels
                        ? 'Loading channels...'
                        : 'Select a channel'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    # {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <FormLabel className="text-sm font-medium mb-1 block">
          Automatically add tasks
        </FormLabel>
        <div className="space-y-2">
          <SwitchBox>
            <div className="flex flex-col gap-3">
              <div className="flex flex-row items-start justify-between">
                <SwitchFormHeader
                  label='Add "Interaction" task'
                  description="Automatically create a Discord interaction task"
                />
                <Switch
                  checked={hasInteractionTask}
                  onCheckedChange={toggleInteractionTask}
                  disabled={isSubmitting}
                />
              </div>

              {hasInteractionTask && (
                <div className="space-y-2 pt-2 border-t">
                  <FormLabel className="text-sm font-medium">
                    Required Roles (Optional)
                  </FormLabel>
                  {loadingRoles ? (
                    <div className="text-sm text-muted-foreground">
                      Loading roles...
                    </div>
                  ) : roles.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No roles available for this server.
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2 overflow-y-auto">
                      {roles.map((role) => (
                        <div
                          key={role.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={selectedRoles.includes(role.id)}
                            onCheckedChange={(checked) =>
                              handleRoleToggle(role.id, checked === true)
                            }
                          />
                          <FormLabel
                            htmlFor={`role-${role.id}`}
                            className="text-sm font-normal cursor-pointer flex items-center gap-2"
                          >
                            {role.color !== 0 && (
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: `#${role.color.toString(16).padStart(6, '0')}`
                                }}
                              />
                            )}
                            {role.name}
                          </FormLabel>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </SwitchBox>
        </div>
      </div>
    </div>
  );
}
