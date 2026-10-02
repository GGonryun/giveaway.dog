'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getPlatformIcon, type PlatformId } from '@/lib/platform-icons';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import type { ResolvedTheme } from '@/lib/theme/get-server-theme';

interface Template {
  id: string;
  label: string;
  platformId: PlatformId;
}

const TEMPLATES: Template[] = [
  {
    id: 'twitter-follow',
    label: 'Twitter Follow to Win',
    platformId: 'x'
  },
  {
    id: 'instagram-follow',
    label: 'Instagram Follow Giveaway',
    platformId: 'instagram'
  },
  {
    id: 'youtube-subscribe',
    label: 'YouTube Subscribe to Win',
    platformId: 'youtube'
  },
  {
    id: 'twitch-follow',
    label: 'Twitch Channel Boost',
    platformId: 'twitch'
  },
  {
    id: 'discord-join',
    label: 'Discord Server Growth',
    platformId: 'discord'
  },
  {
    id: 'tiktok-follow',
    label: 'TikTok Follow Contest',
    platformId: 'tiktok'
  },
  {
    id: 'reddit-upvote',
    label: 'Reddit Upvote Contest',
    platformId: 'reddit'
  },
  {
    id: 'bluesky-follow',
    label: 'Bluesky Follow Contest',
    platformId: 'bluesky'
  },
  { id: 'twitter-retweet', label: 'Retweet & Enter', platformId: 'x' },
  {
    id: 'instagram-like',
    label: 'Like & Tag Friends',
    platformId: 'instagram'
  },
  {
    id: 'youtube-comment',
    label: 'Comment & Win',
    platformId: 'youtube'
  },
  {
    id: 'twitch-sub',
    label: 'Sub Milestone Celebration',
    platformId: 'twitch'
  },
  {
    id: 'discord-active',
    label: 'Active Member Reward',
    platformId: 'discord'
  },
  { id: 'tiktok-duet', label: 'Duet Challenge', platformId: 'tiktok' },
  {
    id: 'reddit-comment',
    label: 'Comment Thread Giveaway',
    platformId: 'reddit'
  },
  {
    id: 'facebook-page',
    label: 'Facebook Page Like',
    platformId: 'facebook'
  },
  {
    id: 'twitter-quote',
    label: 'Quote Tweet Contest',
    platformId: 'x'
  },
  {
    id: 'instagram-story',
    label: 'Story Share Contest',
    platformId: 'instagram'
  },
  {
    id: 'youtube-watch',
    label: 'Watch Time Contest',
    platformId: 'youtube'
  },
  {
    id: 'twitch-raid',
    label: 'Raid Party Giveaway',
    platformId: 'twitch'
  },
  {
    id: 'discord-boost',
    label: 'Server Boost Giveaway',
    platformId: 'discord'
  },
  {
    id: 'tiktok-hashtag',
    label: 'Hashtag Campaign',
    platformId: 'tiktok'
  },
  {
    id: 'linkedin-follow',
    label: 'LinkedIn Follow Campaign',
    platformId: 'linkedin'
  },
  {
    id: 'bluesky-repost',
    label: 'Repost & Win',
    platformId: 'bluesky'
  },
  {
    id: 'twitter-engagement',
    label: 'Twitter Engagement Boost',
    platformId: 'x'
  },
  {
    id: 'instagram-reel',
    label: 'Reels Challenge',
    platformId: 'instagram'
  },
  {
    id: 'youtube-premiere',
    label: 'Premiere Giveaway',
    platformId: 'youtube'
  },
  {
    id: 'twitch-bits',
    label: 'Bits Donation Contest',
    platformId: 'twitch'
  },
  {
    id: 'discord-event',
    label: 'Event Participation',
    platformId: 'discord'
  },
  {
    id: 'github-star',
    label: 'GitHub Star Giveaway',
    platformId: 'github'
  },
  {
    id: 'reddit-community',
    label: 'Subreddit Growth',
    platformId: 'reddit'
  },
  {
    id: 'facebook-share',
    label: 'Share & Tag Contest',
    platformId: 'facebook'
  },
  {
    id: 'tiktok-live',
    label: 'Live Stream Giveaway',
    platformId: 'tiktok'
  },
  {
    id: 'steam-curator',
    label: 'Steam Curator Follow',
    platformId: 'steam'
  },
  {
    id: 'spotify-follow',
    label: 'Spotify Follow Artist',
    platformId: 'spotify'
  },
  {
    id: 'bluesky-engagement',
    label: 'Engagement Boost',
    platformId: 'bluesky'
  },
  {
    id: 'reddit-ama',
    label: 'AMA Participation',
    platformId: 'reddit'
  },
  {
    id: 'patreon-join',
    label: 'Patreon Member Reward',
    platformId: 'patreon'
  },
  {
    id: 'linkedin-engage',
    label: 'Post Engagement Contest',
    platformId: 'linkedin'
  },
  {
    id: 'photo-contest',
    label: 'Photo Submission Contest',
    platformId: 'instagram'
  },
  {
    id: 'video-contest',
    label: 'Video Creation Challenge',
    platformId: 'youtube'
  },
  {
    id: 'kick-follow',
    label: 'Kick Channel Follow',
    platformId: 'kick'
  },
  {
    id: 'threads-follow',
    label: 'Threads Follow Giveaway',
    platformId: 'threads'
  },
  {
    id: 'github-contributor',
    label: 'Contributor Reward',
    platformId: 'github'
  },
  {
    id: 'steam-review',
    label: 'Game Review Contest',
    platformId: 'steam'
  },
  {
    id: 'pinterest-follow',
    label: 'Pinterest Follow Campaign',
    platformId: 'pinterest'
  },
  {
    id: 'facebook-group',
    label: 'Group Member Giveaway',
    platformId: 'facebook'
  },
  {
    id: 'creative-writing',
    label: 'Creative Writing Contest',
    platformId: 'x'
  },
  {
    id: 'spotify-playlist',
    label: 'Playlist Follower Contest',
    platformId: 'spotify'
  },
  {
    id: 'linkedin-newsletter',
    label: 'Newsletter Subscribe',
    platformId: 'linkedin'
  },
  {
    id: 'fan-art',
    label: 'Fan Art Competition',
    platformId: 'instagram'
  },
  {
    id: 'patreon-tier',
    label: 'Tier Upgrade Contest',
    platformId: 'patreon'
  },
  {
    id: 'github-issue',
    label: 'Issue Reporter Contest',
    platformId: 'github'
  },
  {
    id: 'kick-sub',
    label: 'Kick Subscription Contest',
    platformId: 'kick'
  },
  {
    id: 'caption-contest',
    label: 'Caption This Contest',
    platformId: 'x'
  },
  {
    id: 'steam-keys',
    label: 'Steam Keys Giveaway',
    platformId: 'steam'
  },
  {
    id: 'threads-repost',
    label: 'Threads Repost Contest',
    platformId: 'threads'
  },
  {
    id: 'trivia-quiz',
    label: 'Trivia Quiz Giveaway',
    platformId: 'discord'
  },
  {
    id: 'pinterest-pin',
    label: 'Pin & Save Contest',
    platformId: 'pinterest'
  },
  {
    id: 'spotify-share',
    label: 'Share Track Giveaway',
    platformId: 'spotify'
  },
  {
    id: 'email-signup',
    label: 'Email List Growth',
    platformId: 'google'
  },
  {
    id: 'snapchat-add',
    label: 'Snapchat Add Friend',
    platformId: 'snapchat'
  },
  {
    id: 'scavenger-hunt',
    label: 'Social Media Scavenger Hunt',
    platformId: 'x'
  },
  {
    id: 'patreon-milestone',
    label: 'Supporter Milestone',
    platformId: 'patreon'
  },
  {
    id: 'tumblr-follow',
    label: 'Tumblr Follow Blog',
    platformId: 'tumblr'
  },
  {
    id: 'newsletter-sub',
    label: 'Newsletter Subscribe',
    platformId: 'google'
  },
  {
    id: 'pinterest-board',
    label: 'Board Follower Giveaway',
    platformId: 'pinterest'
  },
  {
    id: 'milestone-10k',
    label: '10K Followers Celebration',
    platformId: 'x'
  },
  {
    id: 'product-launch',
    label: 'Product Launch Contest',
    platformId: 'producthunt'
  },
  {
    id: 'snapchat-story',
    label: 'Story View Contest',
    platformId: 'snapchat'
  },
  {
    id: 'website-visit',
    label: 'Website Traffic Boost',
    platformId: 'google'
  },
  {
    id: 'milestone-50k',
    label: '50K Subscribers Milestone',
    platformId: 'youtube'
  },
  { id: 'tumblr-reblog', label: 'Reblog & Win', platformId: 'tumblr' },
  {
    id: 'gaming-tournament',
    label: 'Gaming Tournament',
    platformId: 'twitch'
  },
  {
    id: 'product-upvote',
    label: 'Product Hunt Upvote',
    platformId: 'producthunt'
  },
  {
    id: 'referral-contest',
    label: 'Referral Program',
    platformId: 'google'
  },
  {
    id: 'milestone-100k',
    label: '100K Community Celebration',
    platformId: 'instagram'
  },
  {
    id: 'esports-bracket',
    label: 'Esports Bracket Challenge',
    platformId: 'twitch'
  },
  {
    id: 'birthday-bash',
    label: 'Birthday Bash Giveaway',
    platformId: 'x'
  },
  {
    id: 'game-keys',
    label: 'Game Keys Giveaway',
    platformId: 'steam'
  },
  {
    id: 'anniversary',
    label: 'Anniversary Special',
    platformId: 'instagram'
  },
  {
    id: 'console-giveaway',
    label: 'Gaming Console Giveaway',
    platformId: 'twitch'
  },
  {
    id: 'holiday-christmas',
    label: 'Christmas Giveaway',
    platformId: 'x'
  },
  {
    id: 'merch-drop',
    label: 'Limited Edition Merch',
    platformId: 'x'
  },
  {
    id: 'holiday-halloween',
    label: 'Halloween Contest',
    platformId: 'instagram'
  },
  {
    id: 'signed-item',
    label: 'Autographed Item Contest',
    platformId: 'instagram'
  },
  {
    id: 'holiday-valentine',
    label: "Valentine's Day Special",
    platformId: 'instagram'
  },
  {
    id: 'mystery-box',
    label: 'Mystery Box Giveaway',
    platformId: 'youtube'
  },
  { id: 'black-friday', label: 'Black Friday Deals', platformId: 'x' },
  {
    id: 'bundle-deal',
    label: 'Product Bundle Contest',
    platformId: 'instagram'
  },
  {
    id: 'cyber-monday',
    label: 'Cyber Monday Contest',
    platformId: 'x'
  },
  {
    id: 'early-access',
    label: 'Early Access Pass',
    platformId: 'discord'
  },
  { id: 'new-year', label: 'New Year Giveaway', platformId: 'x' },
  {
    id: 'beta-tester',
    label: 'Beta Tester Recruitment',
    platformId: 'discord'
  },
  {
    id: 'back-to-school',
    label: 'Back to School Contest',
    platformId: 'instagram'
  },
  {
    id: 'community-vote',
    label: 'Community Vote Contest',
    platformId: 'discord'
  },
  {
    id: 'summer-giveaway',
    label: 'Summer Vacation Giveaway',
    platformId: 'instagram'
  },
  {
    id: 'poll-winner',
    label: 'Poll Winner Giveaway',
    platformId: 'x'
  },
  {
    id: 'user-generated',
    label: 'User Generated Content',
    platformId: 'instagram'
  },
  {
    id: 'testimonial-contest',
    label: 'Testimonial Contest',
    platformId: 'google'
  },
  { id: 'review-reward', label: 'Review & Win', platformId: 'google' },
  {
    id: 'survey-entry',
    label: 'Survey Participation',
    platformId: 'google'
  },
  {
    id: 'feedback-form',
    label: 'Feedback Form Contest',
    platformId: 'google'
  },
  {
    id: 'loyalty-program',
    label: 'Loyalty Program Reward',
    platformId: 'google'
  },
  {
    id: 'vip-access',
    label: 'VIP Access Giveaway',
    platformId: 'discord'
  },
  {
    id: 'exclusive-content',
    label: 'Exclusive Content Access',
    platformId: 'patreon'
  },
  {
    id: 'collab-contest',
    label: 'Creator Collaboration',
    platformId: 'youtube'
  },
  {
    id: 'charity-drive',
    label: 'Charity Fundraiser',
    platformId: 'twitch'
  },
  {
    id: 'donation-match',
    label: 'Donation Matching Contest',
    platformId: 'twitch'
  }
];

interface TemplatePillProps {
  template: Template;
  initialTheme: ResolvedTheme;
}

const TemplatePill = ({ template, initialTheme }: TemplatePillProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme =
    mounted && (resolvedTheme === 'dark' || resolvedTheme === 'light')
      ? resolvedTheme
      : initialTheme;

  const iconSrc = getPlatformIcon(template.platformId, theme);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-gradient-to-b from-background to-background/50',
        'border border-background',
        'shadow-[0_0_0_1px_rgba(171,171,171,0.25),0_1px_2px_0_rgba(0,0,0,0.15),0_2px_5px_-1px_rgba(0,0,0,0.08),0_4px_8px_0_rgba(0,0,0,0.1)]'
      )}
      style={{
        minWidth: 'fit-content'
      }}
    >
      <div className="w-4 h-4 relative flex-shrink-0">
        <Image
          src={iconSrc}
          alt={template.label}
          width={16}
          height={16}
          className="object-contain"
        />
      </div>
      <span className="text-xs font-medium text-foreground whitespace-nowrap">
        {template.label}
      </span>
    </div>
  );
};

interface ScrollingTemplatesAnimationProps {
  className?: string;
  initialTheme: ResolvedTheme;
}

export const ScrollingTemplatesAnimation = ({
  className,
  initialTheme
}: ScrollingTemplatesAnimationProps) => {
  const templatesPerRow = Math.ceil(TEMPLATES.length / 3);

  const row1Templates = TEMPLATES.slice(0, templatesPerRow);
  const row2Templates = TEMPLATES.slice(templatesPerRow, templatesPerRow * 2);
  const row3Templates = TEMPLATES.slice(templatesPerRow * 2);

  const row1Content = [...row1Templates, ...row1Templates];
  const row2Content = [...row2Templates, ...row2Templates];
  const row3Content = [...row3Templates, ...row3Templates];

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      <div className="flex flex-col gap-1 py-2">
        <div className="relative">
          <motion.div
            className="flex gap-1"
            animate={{
              x: ['0%', '-50%']
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            {row1Content.map((template, index) => (
              <TemplatePill
                key={`row1-${template.id}-${index}`}
                template={template}
                initialTheme={initialTheme}
              />
            ))}
          </motion.div>
        </div>

        <div className="relative ">
          <motion.div
            className="flex gap-1"
            animate={{
              x: ['-50%', '0%']
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            {row2Content.map((template, index) => (
              <TemplatePill
                key={`row2-${template.id}-${index}`}
                template={template}
                initialTheme={initialTheme}
              />
            ))}
          </motion.div>
        </div>

        <div className="relative ">
          <motion.div
            className="flex gap-1"
            animate={{
              x: ['0%', '-50%']
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            {row3Content.map((template, index) => (
              <TemplatePill
                key={`row3-${template.id}-${index}`}
                template={template}
                initialTheme={initialTheme}
              />
            ))}
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  );
};
