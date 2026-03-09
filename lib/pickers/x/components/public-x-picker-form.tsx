'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { UpgradeModal } from './upgrade-modal';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import { ProgressModal } from './progress-modal';
import { WinnersResultModal } from './winners-result-modal';
import { RateLimitModal } from './rate-limit-modal';
import { SettingsLockedModal } from './settings-locked-modal';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';
import { TweetPreviewCard } from './tweet-preview-card';
import { PUBLIC_PICKER_MAX_WINNERS } from '../constants';
import { useSession } from 'next-auth/react';

const publicPickerFormSchema = z.object({
  postUrl: z
    .string()
    .url('Please enter a valid URL')
    .refine(
      (url) =>
        url.includes('twitter.com') ||
        url.includes('x.com') ||
        url.includes('t.co'),
      {
        message: 'Please enter a valid X (Twitter) post URL'
      }
    ),
  winnersCount: z.number().min(1).max(PUBLIC_PICKER_MAX_WINNERS),
  filters: z.object({
    minimumPostCount: z.number().nullable(),
    minimumAccountAgeDays: z.number().nullable(),
    minimumFollowers: z.number().nullable(),
    minimumFollowing: z.number().nullable(),
    lastPostWithin: z.enum(['PAST_DAY', 'PAST_WEEK', 'PAST_MONTH']).nullable(),
    hasProfileImage: z.boolean(),
    hasBanner: z.boolean(),
    hasLocation: z.boolean(),
    hasDescription: z.boolean()
  })
});

type PublicPickerFormSchema = z.infer<typeof publicPickerFormSchema>;

const LAST_POST_OPTIONS = [
  { label: 'Past Day', value: 'PAST_DAY' },
  { label: 'Past Week', value: 'PAST_WEEK' },
  { label: 'Past Month', value: 'PAST_MONTH' }
] as const;

interface WinnerData {
  drawId: string;
  postId?: string;
  winners: Array<{
    id: string;
    username: string;
    name: string;
    profileImageUrl: string;
    profileUrl: string;
  }>;
  postAuthor: {
    username: string;
    name: string;
    profileUrl: string;
  };
}

interface TweetData {
  id: string;
  text: string;
  username: string | null;
  profileImageUrl: string | null;
  isBlueVerified: boolean;
  userId: string | null;
  media: Array<{
    url: string;
    width: number;
    height: number;
    altText: string | null;
  }>;
  replyCount: number | null;
  retweetCount: number | null;
  favoriteCount: number | null;
  viewCount: number | null;
  quoteCount: number | null;
  createdAt: string;
  estimatedDurationMs: number;
}

export const PublicXPickerForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<
    'multiple-posts' | 'schedule' | 'more-winners'
  >('multiple-posts');
  const [showSearching, setShowSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [winnerData, setWinnerData] = useState<WinnerData | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [showRateLimit, setShowRateLimit] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [tweetData, setTweetData] = useState<TweetData | null>(null);
  const [isReRolling, setIsReRolling] = useState(false);
  const [showSettingsLocked, setShowSettingsLocked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const form = useForm<PublicPickerFormSchema>({
    resolver: zodResolver(publicPickerFormSchema),
    defaultValues: {
      postUrl: '',
      winnersCount: 1,
      filters: {
        minimumPostCount: 100,
        minimumAccountAgeDays: 90,
        minimumFollowers: 100,
        minimumFollowing: 100,
        lastPostWithin: null,
        hasProfileImage: true,
        hasBanner: false,
        hasLocation: false,
        hasDescription: false
      }
    }
  });

  const onSubmit = async (data: PublicPickerFormSchema) => {
    setIsSubmitting(true);

    if (currentStep === 1) {
      try {
        const response = await fetch('/api/pickers/x/public/load-tweet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            postUrl: data.postUrl
          })
        });

        if (response.status === 429) {
          const retryAfter = parseInt(
            response.headers.get('Retry-After') || '60'
          );
          setRateLimitSeconds(retryAfter);
          setShowRateLimit(true);
          setIsSubmitting(false);
          return;
        }

        const result = await response.json();

        if (result.success) {
          setTweetData(result.data);
          setCurrentStep(2);
        } else {
          toast.error(
            result.error || 'Failed to load tweet. Please try again.'
          );
        }
      } catch (error) {
        toast.error('An error occurred. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setShowSearching(true);

      try {
        const response = await fetch('/api/pickers/x/public/pick-winners', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            postUrl: data.postUrl,
            winnersCount: data.winnersCount,
            filters: data.filters
          })
        });

        if (response.status === 429) {
          setShowSearching(false);
          const retryAfter = parseInt(
            response.headers.get('Retry-After') || '60'
          );
          setRateLimitSeconds(retryAfter);
          setShowRateLimit(true);
          return;
        }

        const result = await response.json();

        setShowSearching(false);

        if (result.success) {
          setWinnerData(result.data);
          setShowResults(true);
        } else {
          toast.error('Failed to pick winners. Please try again.');
        }
      } catch (error) {
        setShowSearching(false);
        toast.error('An error occurred. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleReRoll = async () => {
    setIsReRolling(true);

    const formData = form.getValues();

    try {
      const response = await fetch('/api/pickers/x/public/pick-winners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postUrl: formData.postUrl,
          winnersCount: formData.winnersCount,
          filters: formData.filters
        })
      });

      if (response.status === 429) {
        setShowResults(false);
        const retryAfter = parseInt(
          response.headers.get('Retry-After') || '60'
        );
        setRateLimitSeconds(retryAfter);
        setShowRateLimit(true);
        return;
      }

      const result = await response.json();

      if (result.success) {
        setWinnerData(result.data);
      } else {
        toast.error('Failed to re-roll winners. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsReRolling(false);
    }
  };

  const lastPostWithin = form.watch('filters.lastPostWithin');

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-6">
            {currentStep === 1 ? (
              <>
                <FormField
                  control={form.control}
                  name="postUrl"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-end justify-between mb-1">
                        <FormLabel>Post URL</FormLabel>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setUpgradeFeature('multiple-posts');
                            setUpgradeModalOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add More
                        </Button>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="https://x.com/username/status/..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Paste the URL of your post with the giveaway
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Loading...' : 'Load Tweet'}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                {tweetData && (
                  <TweetPreviewCard
                    tweetData={tweetData}
                    onChangeClick={() => {
                      setCurrentStep(1);
                      setTweetData(null);
                      router.replace(pathname, { scroll: false });
                    }}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Pick Winners'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 relative">
          {!isAuthenticated && (
            <div
              className="absolute inset-0 z-10 cursor-pointer"
              onClick={() => setShowSettingsLocked(true)}
            />
          )}
          <CardHeader>
            <CardTitle className="text-lg">Draw Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="winnersCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Winners</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={PUBLIC_PICKER_MAX_WINNERS}
                      {...field}
                      disabled={!isAuthenticated}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        if (value > PUBLIC_PICKER_MAX_WINNERS) {
                          setUpgradeFeature('more-winners');
                          setUpgradeModalOpen(true);
                        } else {
                          field.onChange(value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    How many winners do you want to pick?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SwitchBox>
              <div className="flex items-center justify-between">
                <SwitchFormHeader
                  label="Schedule for Later"
                  description="Set a specific date and time for your drawing"
                />
                <Switch
                  checked={false}
                  disabled={!isAuthenticated}
                  onClick={() => {
                    setUpgradeFeature('schedule');
                    setUpgradeModalOpen(true);
                  }}
                />
              </div>
            </SwitchBox>
          </CardContent>
        </Card>

        <Card className="border-2 relative">
          {!isAuthenticated && (
            <div
              className="absolute inset-0 z-10 cursor-pointer"
              onClick={() => setShowSettingsLocked(true)}
            />
          )}
          <CardHeader>
            <CardTitle className="text-lg">Filters & Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="filters.minimumPostCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Post Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="No minimum"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="filters.minimumAccountAgeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Age (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="No minimum"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="filters.minimumFollowers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Followers</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="No minimum"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="filters.minimumFollowing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Following</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="No minimum"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="filters.lastPostWithin"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Last Post</FormLabel>
                      <FormDescription>
                        Only include users who posted recently
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={lastPostWithin != null}
                        onClick={() => {
                          if (lastPostWithin == null) {
                            field.onChange('PAST_WEEK');
                          } else {
                            field.onChange(null);
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Collapsible open={lastPostWithin != null}>
                <CollapsibleContent>
                  <FormField
                    control={form.control}
                    name="filters.lastPostWithin"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          value={field.value ?? 'PAST_WEEK'}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LAST_POST_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>

              <FormField
                control={form.control}
                name="filters.hasProfileImage"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Profile Image</FormLabel>
                      <FormDescription>
                        Require users to have a profile image
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="filters.hasBanner"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Banner Image</FormLabel>
                      <FormDescription>
                        Require users to have a banner image
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="filters.hasLocation"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Location</FormLabel>
                      <FormDescription>
                        Require users to have location set
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="filters.hasDescription"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Bio/Description</FormLabel>
                      <FormDescription>
                        Require users to have a bio
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <UpgradeModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          feature={upgradeFeature}
        />

        <ProgressModal
          open={showSearching}
          estimatedDurationMs={tweetData?.estimatedDurationMs}
        />

        <RateLimitModal
          open={showRateLimit}
          onClose={() => setShowRateLimit(false)}
          retryAfterSeconds={rateLimitSeconds}
        />

        <SettingsLockedModal
          open={showSettingsLocked}
          onClose={() => setShowSettingsLocked(false)}
        />

        {winnerData && (
          <WinnersResultModal
            open={showResults}
            onClose={() => setShowResults(false)}
            winners={winnerData.winners}
            drawId={winnerData.drawId}
            postId={winnerData.postId}
            postAuthor={winnerData.postAuthor}
            onReRoll={handleReRoll}
            isReRolling={isReRolling}
          />
        )}
      </form>
    </FormProvider>
  );
};
