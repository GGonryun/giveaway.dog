import { assertNever } from '@/lib/errors';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useCallback, useEffect, useMemo } from 'react';
import { useArrayContext } from '@/components/hooks/use-array-context';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { TaskType } from '@prisma/client';
import { HelpDialog } from '@/components/patterns/help-dialog';
import {
  DISCORD_PUBLIC_CHANNEL_URL,
  YOUTUBE_CHANNEL_ID,
  YOUTUBE_CHANNEL_URL
} from '@/lib/settings';
import Link from 'next/link';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export const AdditionalSettings: React.FC<{ type: TaskType }> = ({ type }) => {
  const content = useCallback(() => {
    switch (type) {
      case 'TWITTER_CONNECT':
      case 'BONUS_TASK':
        return <></>;
      case 'VISIT_URL':
        return (
          <>
            <HrefFormField />
            <LabelFormField />
          </>
        );
      case 'SECRET_CODE':
        return (
          <>
            <SecretCodeFormField />
            <SecretHintFormField />
          </>
        );
      case 'TWITTER_FOLLOW':
        return <TwitterUsernameFormField />;
      case 'TWITTER_RETWEET':
        return <TweetIdFormField />;
      case 'STEAM_WISHLIST':
        return <SteamAppIdFormField />;
      case 'DISCORD_JOIN':
        return (
          <>
            <DiscordGuildIdFormField />
            <DiscordInviteLinkFormField />
          </>
        );
      case 'TWITCH_FOLLOW':
        return <TwitchFollowFormField />;
      case 'KICK_FOLLOW':
        return <KickFollowFormField />;
      case 'YOUTUBE_VISIT':
        return (
          <>
            <YouTubeChannelUrlFormField />
            <YouTubeSubscriptionConfirmationFormField />
          </>
        );
      default:
        throw assertNever(type);
    }
  }, []);

  return <div className="space-y-2">{content()}</div>;
};

const YouTubeChannelUrlFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  const standardStyleUrl = `https://www.youtube.com/@your_channel_name`;
  const channelStyleUrl = `https://www.youtube.com/channel/<CHANNEL_ID>`;

  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.channelUrl`}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-2">
            <FormLabel>Channel URL</FormLabel>
            <HelpDialog
              title={'Help: YouTube Channel URL'}
              content={
                <div className="space-y-4">
                  <p>
                    The YouTube Channel URL is used to verify that the user has
                    visited your YouTube channel. Two types of URLs can be used:
                  </p>
                  <ul>
                    <li>
                      Standard URL:{' '}
                      <Link
                        href={standardStyleUrl}
                        target="_blank"
                        className="hover:underline text-primary wrap-anywhere"
                      >
                        {standardStyleUrl}
                      </Link>
                    </li>
                    <li>
                      Channel URL:{' '}
                      <Link
                        href={channelStyleUrl}
                        target="_blank"
                        className="hover:underline text-primary wrap-anywhere"
                      >
                        {channelStyleUrl}
                      </Link>
                    </li>
                  </ul>
                  <p>
                    To get the channel URL, go to your YouTube channel and copy
                    the URL from the address bar.
                  </p>
                  <p>
                    If you can't find your channel URL, you can also get it by
                    clicking on your profile picture in the top right corner,
                    then selecting "Your Channel" from the dropdown menu.
                  </p>
                  <div className="relative mx-auto w-full max-w-64 aspect-[558/358] border rounded-lg overflow-hidden">
                    <Image
                      src="/images/youtube-channel-url-help-1.png"
                      alt="YouTube Channel URL"
                      fill={true}
                      className="object-contain"
                    />
                  </div>

                  <div className="relative mx-auto w-full max-w-64 aspect-[592/480] border rounded-lg overflow-hidden">
                    <Image
                      src="/images/youtube-channel-url-help-2.png"
                      alt="YouTube Channel URL"
                      fill={true}
                      className="object-contain"
                    />
                  </div>
                  <br />

                  <p>
                    Then click on "more" next to your channel's description to
                    see additional details including your channel ID.
                  </p>
                  <div className="relative mx-auto w-full max-w-128 aspect-[1214/352] border rounded-lg overflow-hidden">
                    <Image
                      src="/images/youtube-channel-url-help-3.png"
                      alt="YouTube Channel URL"
                      fill={true}
                      className="object-contain"
                    />
                  </div>
                  <div className="relative mx-auto w-full max-w-64 aspect-[709/581] border rounded-lg overflow-hidden">
                    <Image
                      src="/images/youtube-channel-url-help-4.png"
                      alt="YouTube Channel URL"
                      fill={true}
                      className="object-contain"
                    />
                  </div>
                  <p>
                    The URL will look something like this:{' '}
                    <Link
                      href={standardStyleUrl}
                      target="_blank"
                      className="hover:underline text-primary wrap-anywhere"
                    >
                      {standardStyleUrl}
                    </Link>
                  </p>
                </div>
              }
            />
          </div>
          <FormControl>
            <Input type="url" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const YouTubeSubscriptionConfirmationFormField: React.FC = () => {
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
              label="Show Subscription Confirmation"
              description="Ask users to confirm they have subscribed to your YouTube channel."
              help={{
                title: 'Help: Show Subscription Confirmation',
                content: (
                  <div className="space-y-4">
                    <p>
                      Enabling this option will prompt users to confirm that
                      they have subscribed to your YouTube channel after
                      visiting it. In order to remain compliant with{' '}
                      <Link
                        href="https://support.google.com/youtube/answer/3399767"
                        target="_blank"
                        className="hover:underline text-primary"
                      >
                        YouTube's Fake Engagement
                      </Link>{' '}
                      policies, we cannot automatically verify subscriptions. It
                      is the user's responsibility to decide whether to
                      subscribe or not.
                    </p>
                    <p>
                      This is done by appending{' '}
                      <code className="bg-muted"> ?sub_confirmation=1</code> to
                      the end of your YouTube channel URL. When users visit the
                      modified URL, they will see a prompt asking them to
                      confirm their subscription.
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

const HrefFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.href`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Link URL</FormLabel>
          <FormControl>
            <Input type="url" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const LabelFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.label`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Link Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const TwitterUsernameFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.username`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Profile URL</FormLabel>
          <FormControl>
            <Input type="text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const TweetIdFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.tweetId`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Post ID</FormLabel>
          <FormControl>
            <Input type="text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const SteamAppIdFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.appId`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Steam App ID</FormLabel>
          <FormControl>
            <Input type="text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const DiscordGuildIdFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.channel`}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-end gap-1">
            <FormLabel>Channel Link</FormLabel>
            <HelpDialog
              title={'Help: Channel Link'}
              content={
                <div>
                  <p>
                    A discord channel link is used to verify that the user has
                    joined the server. To get the channel link, right-click on
                    any channel in the server and select "Copy Link".
                  </p>
                  <br />
                  <div className="relative mx-auto w-full max-w-64 aspect-[359/500] border rounded-lg overflow-hidden">
                    <Image
                      src="/images/discord-channel-url.png"
                      alt="Discord Channel URL"
                      fill={true}
                      className="object-contain"
                    />
                  </div>
                  <br />
                  <p>
                    The URL will look something like this:{' '}
                    <Link
                      href={DISCORD_PUBLIC_CHANNEL_URL}
                      target="_blank"
                      className="hover:underline text-primary wrap-anywhere"
                    >
                      {DISCORD_PUBLIC_CHANNEL_URL}
                    </Link>
                  </p>
                </div>
              }
            />
          </div>
          <FormControl>
            <Input type="text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const DiscordInviteLinkFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.invite`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Invite Link</FormLabel>
          <FormControl>
            <Input type="text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const TwitchFollowFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.channel`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Twitch Channel Link</FormLabel>
          <FormControl>
            <Input type="text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const KickFollowFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.channel`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Kick Channel Link</FormLabel>
          <FormControl>
            <Input type="text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const SecretCodeFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.code`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Code</FormLabel>
          <FormControl>
            <Input type="text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const SecretHintFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.hint`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Hint</FormLabel>
          <FormControl>
            <Textarea {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
