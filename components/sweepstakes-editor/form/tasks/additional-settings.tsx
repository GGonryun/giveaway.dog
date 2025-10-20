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
      case 'TWITTER_FOLLOW':
        return <TwitterUsernameFormField />;
      case 'TWITTER_RETWEET':
        return <TweetIdFormField />;
      case 'STEAM_WISHLIST':
        return <SteamAppIdFormField />;
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
