import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useArrayContext } from '@/components/hooks/use-array-context';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { TaskType } from '@prisma/client';
import { assertNever } from '@/lib/errors';

export const BaseSettings: React.FC<{ type: TaskType }> = ({ type }) => {
  switch (type) {
    case 'YOUTUBE_VISIT':
      return (
        <BaseSettingsContainer>
          <YouTubeChannelField />
          <ValueField />
        </BaseSettingsContainer>
      );
    case 'BONUS_TASK':
    case 'BONUS_TIMED':
    case 'BONUS_LIMITED':
    case 'VISIT_URL':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_LIKE':
    case 'TWITTER_LIKE_IMPORT':
    case 'STEAM_WISHLIST':
    case 'DISCORD_JOIN':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
    case 'SECRET_CODE':
    case 'INSTAGRAM_VISIT':
    case 'INSTAGRAM_LIKE':
    case 'BONUS_LOYALTY':
      return (
        <BaseSettingsContainer>
          <TitleField />
          <ValueField />
        </BaseSettingsContainer>
      );
    default:
      throw assertNever(type);
  }
};

const BaseSettingsContainer: React.PC = ({ children }) => {
  return (
    <div>
      <div className="grid grid-cols-[1fr_96px] gap-2">{children}</div>
    </div>
  );
};

const TitleField = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.title`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Title</FormLabel>
          <FormControl>
            <Input
              placeholder="Title"
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const ValueField = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.value`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Value</FormLabel>
          <FormControl>
            <Input
              placeholder="Value"
              type="number"
              value={field.value}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (isNaN(v)) {
                  return field.onChange(0);
                }
                if (v < 0) {
                  return field.onChange(0);
                }
                return field.onChange(v);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const YouTubeChannelField = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.channelName`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Channel Name</FormLabel>
          <FormControl>
            <Input
              placeholder="Channel Name"
              value={field.value ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                form.setValue(
                  `tasks.${index}.title`,
                  value
                    ? `Visit ${value} on YouTube`
                    : 'Visit our YouTube Channel'
                );
                return field.onChange(e.target.value);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
