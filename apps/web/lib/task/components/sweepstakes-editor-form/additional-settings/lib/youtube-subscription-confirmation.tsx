import { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';
import { useMemo } from 'react';
import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage
} from '@giveaway/ui-primitives/form';
import Link from 'next/link';
import Image from 'next/image';
import { Switch } from '@giveaway/ui-primitives/switch';
import {
  SwitchBox,
  SwitchFormHeader
} from '@giveaway/ui-layouts/form-layout/switch-form-header';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import { InfoIcon } from 'lucide-react';

export const YouTubeSubscriptionConfirmationFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  const channelUrl = useWatch({
    control: form.control,
    name: `tasks.${index}.channelUrl`
  });

  const subscriptionParamExists = useMemo(() => {
    return channelUrl?.includes('?sub_confirmation=1') || false;
  }, [channelUrl]);

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name={`tasks.${index}.subConfirmation`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Append Subscription Prompt"
              description="Ask users if they would like to subscribe to your YouTube channel."
              help={{
                title: 'Help: Subscription Prompt',
                content: (
                  <div className="space-y-4">
                    <p>
                      In order to remain compliant with{' '}
                      <Link
                        href="https://support.google.com/youtube/answer/3399767"
                        target="_blank"
                        className="hover:underline text-primary"
                      >
                        YouTube's Fake Engagement
                      </Link>{' '}
                      policies, we cannot require users to subscribe to a
                      channel as part of the sweepstake. It is up to the user's
                      discretion to decide whether or not they wish to subscribe
                      to your channel
                    </p>
                    <p>
                      Enabling this flag will append
                      <code className="bg-muted"> ?sub_confirmation=1</code> to
                      the end of your YouTube channel URL. When users visit the
                      modified URL, they will see a prompt asking them if they
                      would like to subscribe to your channel.
                    </p>
                    <div className="relative mx-auto w-full max-w-128 aspect-[744/354] border rounded-lg overflow-hidden">
                      <Image
                        src="/images/youtube-sub-confirmation-help-1.png"
                        alt="YouTube Channel URL"
                        fill={true}
                        className="object-contain"
                      />
                    </div>
                  </div>
                )
              }}
            />
            <FormControl>
              <Switch
                checked={Boolean(subscriptionParamExists) || field.value}
                onCheckedChange={(e) => {
                  if (subscriptionParamExists) {
                    return;
                  }

                  return field.onChange(e);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {subscriptionParamExists && (
        <Alert variant="success" className="mt-2">
          <InfoIcon className="size-5 shrink-0" />
          <AlertTitle>This field cannot be changed</AlertTitle>
          <AlertDescription>
            The subscription confirmation parameter is already present in the
            channel URL.
          </AlertDescription>
        </Alert>
      )}
    </SwitchBox>
  );
};
