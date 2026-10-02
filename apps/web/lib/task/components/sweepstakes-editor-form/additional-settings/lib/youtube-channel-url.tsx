import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useArrayContext } from '@/components/hooks/use-array-context';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { HelpDialog } from '@/components/patterns/help-dialog';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useYouTubeChannelValidation } from '../../../../hooks/use-youtube-channel-validation';

export const YouTubeChannelUrlFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  const channelUrl = useWatch({
    control: form.control,
    name: `tasks.${index}.channelUrl`
  });

  const taskErrors = form.formState.errors?.tasks?.[index];
  const fieldError =
    taskErrors && 'channelUrl' in taskErrors
      ? taskErrors.channelUrl
      : undefined;

  const { status } = useYouTubeChannelValidation({
    channelUrl,
    debounceMs: 1000,
    skipValidation: !!fieldError,
    onError: (error) => {
      form.setError(`tasks.${index}.channelUrl`, {
        type: 'manual',
        message: error
      });
    }
  });

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
          {status === 'checking' && (
            <FormDescription className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Verifying channel URL...
            </FormDescription>
          )}
          {status === 'success' && channelUrl && (
            <FormDescription className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Channel URL verified successfully
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
