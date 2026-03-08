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
import {
  Plus,
  X,
  BadgeCheck,
  MessageCircle,
  Repeat2,
  Heart,
  Eye,
  ClockIcon,
  ExternalLink,
  ImageIcon
} from 'lucide-react';
import { UpgradeModal } from './upgrade-modal';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import { ProgressModal } from './progress-modal';
import { WinnersResultModal } from './winners-result-modal';
import { RateLimitModal } from './rate-limit-modal';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter, usePathname } from 'next/navigation';

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
  winnersCount: z.number().min(1).max(100),
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
  username: string;
  profileImageUrl: string;
  isBlueVerified: boolean;
  media?: Array<{
    url: string;
    altText?: string;
  }>;
  replyCount: number | null;
  retweetCount: number | null;
  favoriteCount: number | null;
  viewCount: number | null;
  createdAt: string;
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
  const router = useRouter();
  const pathname = usePathname();

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

        const result = await response.json();

        if (result.success) {
          setTweetData(result.data);
          setCurrentStep(2);
        } else {
          toast.error(result.error || 'Failed to load tweet. Please try again.');
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

  const lastPostWithin = form.watch('filters.lastPostWithin');

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="postUrl"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-end justify-between mb-1">
                    <FormLabel>X Post URL</FormLabel>
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
                      disabled={currentStep === 2}
                    />
                  </FormControl>
                  <FormDescription>
                    Paste the URL of your X post with the giveaway
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentStep === 1 ? (
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Loading...' : 'Load Tweet'}
              </Button>
            ) : (
              <div className="space-y-4">
                {tweetData && (
                  <Card className="bg-muted/50">
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={
                                tweetData.profileImageUrl ||
                                `https://avatar.vercel.sh/${tweetData.username}`
                              }
                              alt={`@${tweetData.username}`}
                            />
                            <AvatarFallback>
                              {tweetData.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1 min-w-0">
                                <a
                                  href={`https://x.com/${tweetData.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium truncate hover:underline"
                                >
                                  @{tweetData.username || 'unknown'}
                                </a>
                                {tweetData.isBlueVerified && (
                                  <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCurrentStep(1);
                                  setTweetData(null);
                                  router.replace(pathname, { scroll: false });
                                }}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Change
                              </Button>
                            </div>
                            {tweetData.text && (
                              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                {tweetData.text}
                              </p>
                            )}
                            {tweetData.media && tweetData.media.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 mt-3">
                                {tweetData.media.map((media, idx) => (
                                  <div
                                    key={idx}
                                    className="relative aspect-video rounded-md overflow-hidden bg-muted group"
                                  >
                                    <img
                                      src={media.url}
                                      alt={media.altText || 'Tweet image'}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ImageIcon className="h-8 w-8 text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-3">
                              {tweetData.replyCount !== null && (
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3 mb-px" />
                                  {tweetData.replyCount}
                                </span>
                              )}
                              {tweetData.retweetCount !== null && (
                                <span className="flex items-center gap-1">
                                  <Repeat2 className="h-3 w-3 mb-px" />
                                  {tweetData.retweetCount}
                                </span>
                              )}
                              {tweetData.favoriteCount !== null && (
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3 mb-px" />
                                  {tweetData.favoriteCount}
                                </span>
                              )}
                              {tweetData.viewCount !== null && (
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3 mb-px" />
                                  {tweetData.viewCount.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {tweetData.createdAt && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="h-3 w-3 mb-px" />
                                  {new Date(tweetData.createdAt).toLocaleString(
                                    'en-US',
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    }
                                  )}
                                </span>
                                <span>•</span>
                                <a
                                  href={`https://x.com/${tweetData.username}/status/${tweetData.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline flex items-center gap-1"
                                >
                                  Link to Post
                                  <ExternalLink className="h-3 w-3 mb-px" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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

        <Card className="border-2">
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
                      max={10}
                      {...field}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        if (value > 10) {
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
                  onClick={() => {
                    setUpgradeFeature('schedule');
                    setUpgradeModalOpen(true);
                  }}
                />
              </div>
            </SwitchBox>
          </CardContent>
        </Card>

        <Card className="border-2">
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

        <ProgressModal open={showSearching} />

        <RateLimitModal
          open={showRateLimit}
          onClose={() => setShowRateLimit(false)}
          retryAfterSeconds={rateLimitSeconds}
        />

        {winnerData && (
          <WinnersResultModal
            open={showResults}
            onClose={() => setShowResults(false)}
            winners={winnerData.winners}
            drawId={winnerData.drawId}
            postId={winnerData.postId}
            postAuthor={winnerData.postAuthor}
          />
        )}
      </form>
    </FormProvider>
  );
};
