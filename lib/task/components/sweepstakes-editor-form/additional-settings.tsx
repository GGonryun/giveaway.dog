import { assertNever } from '@/lib/errors';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useCallback } from 'react';
import { useArrayContext } from '@/components/hooks/use-array-context';
import { useFormContext } from 'react-hook-form';
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
import { DISCORD_PUBLIC_CHANNEL_URL } from '@/lib/settings';
import Link from 'next/link';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';

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
      default:
        throw assertNever(type);
    }
  }, []);

  return <div className="space-y-2">{content()}</div>;
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
            <Input type="url" {...field} />
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
