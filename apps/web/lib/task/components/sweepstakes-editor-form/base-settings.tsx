import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import { assertNever } from '@giveaway/util-errors';
import { TaskType } from '../../schemas';

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
    case 'BONUS_COMPLETE_PROFILE':
    case 'BONUS_TIMED':
    case 'BONUS_LIMITED':
    case 'VISIT_URL':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_RETWEET_IMPORT_V2':
    case 'TWITTER_LIKE':
    case 'TWITTER_LIKE_IMPORT':
    case 'STEAM_WISHLIST':
    case 'STEAM_FOLLOW':
    case 'DISCORD_JOIN':
    case 'TWITCH_FOLLOW':
    case 'TWITCH_CHAT_IMPORT':
    case 'KICK_FOLLOW':
    case 'SECRET_CODE':
    case 'SECRET_CODE_V2':
    case 'INSTAGRAM_VISIT':
    case 'INSTAGRAM_LIKE':
    case 'INSTAGRAM_COMMENT':
    case 'FACEBOOK_VISIT_PAGE':
    case 'FACEBOOK_VIEW_POST':
    case 'TIKTOK_FOLLOW':
    case 'TIKTOK_LIKE':
    case 'BLUESKY_CONNECT':
    case 'VELORA_CONNECT':
    case 'LINKEDIN_CONNECT':
    case 'LINKEDIN_FOLLOW':
    case 'VELORA_FOLLOW':
    case 'BONUS_LOYALTY':
    case 'ASK_QUESTION':
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
    case 'BLUESKY_FOLLOW':
    case 'BLUESKY_LIKE':
    case 'BLUESKY_REPOST':
    case 'BLUESKY_LIKE_IMPORT':
    case 'BLUESKY_REPOST_IMPORT':
    case 'DISCORD_INTERACTION_IMPORT':
    case 'REFERRAL_LINK':
    case 'SUBMIT_MEDIA':
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
