import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import { HelpDialog } from '@giveaway/ui-layouts/help-dialog';
import Image from 'next/image';

export const FacebookPageUrl: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.pageUrl`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Page URL</FormLabel>
          <FormControl>
            <Input type="text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const FacebookPostUrl: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.postUrl`}
      render={({ field }) => (
        <FormItem>
          <div className="flex gap-1 items-center">
            <FormLabel>Post URL</FormLabel>
            <HelpDialog
              title="Help: Facebook Post URL"
              content={
                <div className="space-y-4">
                  <p>
                    Your Facebook Post URL is the direct link to the specific
                    post, this can be found by navigating to the post on
                    Facebook and copying the URL from the address bar or by
                    clicking share and selecting 'Copy link'.
                  </p>
                  <div className="relative mx-auto max-w-full aspect-[601/335] border rounded-lg overflow-hidden">
                    <Image
                      src="/images/facebook-post-url-help-1.png"
                      alt="Facebook Post URL"
                      fill={true}
                      className="object-contain"
                    />
                  </div>

                  <div className="relative mx-auto w-full max-w-full aspect-[555/432] border rounded-lg overflow-hidden">
                    <Image
                      src="/images/facebook-post-url-help-2.png"
                      alt="YouTube Channel URL"
                      fill={true}
                      className="object-contain"
                    />
                  </div>

                  <p>
                    For more information on finding your Facebook Post URL,
                    visit the{' '}
                    <a
                      href="https://www.facebook.com/help/163779957017799"
                      target="_blank"
                      className="text-primary hover:underline"
                    >
                      Facebook Help Center
                    </a>
                    .
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
