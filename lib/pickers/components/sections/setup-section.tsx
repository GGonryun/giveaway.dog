'use client';

import { useFormContext } from 'react-hook-form';
import { PickerFormSchema } from '@/lib/pickers/schemas/form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UnifiedSectionHeader } from '@/components/patterns/form-layout/section-header';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { timezone } from '@/lib/time';
import { memo, useMemo } from 'react';
import { IntegrationsSchema, hasFeature } from '@/lib/integrations/schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { datetime } from '@/lib/date';

interface SetupSectionProps {
  integrations?: IntegrationsSchema;
}

export const SetupSection: React.FC<SetupSectionProps> = ({ integrations }) => {
  const form = useFormContext<PickerFormSchema>();
  const params = useParams();
  const slug = params.slug as string;

  const twitterIntegrations =
    integrations?.filter(
      (i) =>
        i.provider === 'TWITTER' &&
        i.status === 'ACTIVE' &&
        hasFeature(i, 'IMPORT_TASKS')
    ) || [];

  const hasTwitterWithoutPermissions = integrations?.some(
    (i) =>
      i.provider === 'TWITTER' &&
      i.status === 'ACTIVE' &&
      !hasFeature(i, 'IMPORT_TASKS')
  );

  return (
    <UnifiedSectionHeader
      label="Overview"
      description="Configure the basic details of your picker"
    >
      <FormField
        control={form.control}
        name="setup.integrationId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Integration</FormLabel>
            {twitterIntegrations.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex flex-col gap-2">
                  <p>
                    {hasTwitterWithoutPermissions
                      ? "Your X integration doesn't have import permissions. Add permissions to use pickers."
                      : 'No X integrations found. You need to connect an X account to use pickers.'}
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-fit">
                    <Link href={`/app/${slug}/settings/integrations`}>
                      <SocialXIcon className="h-4 w-4 mr-2" />
                      {hasTwitterWithoutPermissions
                        ? 'Add Permissions'
                        : 'Add X Integration'}
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your account" />
                  </SelectTrigger>
                  <SelectContent>
                    {twitterIntegrations.map((integration) => (
                      <SelectItem key={integration.id} value={integration.id}>
                        <div className="flex items-center gap-2">
                          <SocialXIcon className="h-4 w-4" />
                          {integration.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="setup.name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Picker Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter picker name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="setup.postUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Post URL</FormLabel>
            <FormControl>
              <Input
                placeholder="https://twitter.com/username/status/..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="winners.quota"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of Winners</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <TimingField />
    </UnifiedSectionHeader>
  );
};

export const TimingField = () => {
  const form = useFormContext<PickerFormSchema>();

  const timing = form.watch('timing');

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name="timing"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Start Immediately"
              description="If enabled, the picker will start processing immediately upon creation. Otherwise, you can provide a custom start and end date."
            />
            <FormControl>
              <Switch
                checked={timing == null}
                onClick={() => {
                  if (timing == null) {
                    field.onChange({
                      startDate: null,
                      endDate: datetime.daysFromNow(3).toISOString(),
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    });
                  } else {
                    field.onChange(null);
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Collapsible open={timing != null}>
        <CollapsibleContent className="flex flex-col gap-2">
          <FormField
            control={form.control}
            name="timing.startDate"
            render={({ field }) => (
              <FormItem className="grow mt-2">
                <FormLabel>Start Date (Optional)</FormLabel>
                <FormControl>
                  <DateTimePicker
                    hourCycle={12}
                    onChange={(date) =>
                      field.onChange(date?.toISOString() ?? null)
                    }
                    value={field.value ? new Date(field.value) : undefined}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timing.endDate"
            render={({ field }) => (
              <FormItem className="grow">
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <DateTimePicker
                    hourCycle={12}
                    onChange={(date) => field.onChange(date?.toISOString())}
                    value={field.value ? new Date(field.value) : new Date()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timing.timeZone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a timezone" />
                      <MemoTimezone />
                    </SelectTrigger>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CollapsibleContent>
      </Collapsible>
    </SwitchBox>
  );
};

const MemoTimezone = memo(() => {
  const options = useMemo(() => timezone.options, []);

  return (
    <SelectContent>
      {options.map(({ zone, label }) => (
        <SelectItem key={zone} value={zone}>
          {label}
        </SelectItem>
      ))}
    </SelectContent>
  );
});
