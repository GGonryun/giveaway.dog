'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  label: string;
  icon: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'twitter-follow',
    label: 'Twitter Follow to Win',
    icon: '/platforms/x.svg'
  },
  {
    id: 'instagram-follow',
    label: 'Instagram Follow Giveaway',
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'youtube-subscribe',
    label: 'YouTube Subscribe to Win',
    icon: '/platforms/youtube.svg'
  },
  {
    id: 'twitch-follow',
    label: 'Twitch Channel Boost',
    icon: '/platforms/twitch.svg'
  },
  {
    id: 'discord-join',
    label: 'Discord Server Growth',
    icon: '/platforms/discord.svg'
  },
  {
    id: 'tiktok-follow',
    label: 'TikTok Follow Contest',
    icon: '/platforms/tiktok.svg'
  },
  {
    id: 'reddit-upvote',
    label: 'Reddit Upvote Contest',
    icon: '/platforms/reddit.svg'
  },
  {
    id: 'bluesky-follow',
    label: 'Bluesky Follow Contest',
    icon: '/platforms/bluesky.svg'
  },
  { id: 'twitter-retweet', label: 'Retweet & Enter', icon: '/platforms/x.svg' },
  {
    id: 'instagram-like',
    label: 'Like & Tag Friends',
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'youtube-comment',
    label: 'Comment & Win',
    icon: '/platforms/youtube.svg'
  },
  {
    id: 'twitch-sub',
    label: 'Sub Milestone Celebration',
    icon: '/platforms/twitch.svg'
  },
  {
    id: 'discord-active',
    label: 'Active Member Reward',
    icon: '/platforms/discord.svg'
  },
  { id: 'tiktok-duet', label: 'Duet Challenge', icon: '/platforms/tiktok.svg' },
  {
    id: 'reddit-comment',
    label: 'Comment Thread Giveaway',
    icon: '/platforms/reddit.svg'
  },
  {
    id: 'facebook-page',
    label: 'Facebook Page Like',
    icon: '/platforms/facebook.svg'
  },
  {
    id: 'twitter-quote',
    label: 'Quote Tweet Contest',
    icon: '/platforms/x.svg'
  },
  {
    id: 'instagram-story',
    label: 'Story Share Contest',
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'youtube-watch',
    label: 'Watch Time Contest',
    icon: '/platforms/youtube.svg'
  },
  {
    id: 'twitch-raid',
    label: 'Raid Party Giveaway',
    icon: '/platforms/twitch.svg'
  },
  {
    id: 'discord-boost',
    label: 'Server Boost Giveaway',
    icon: '/platforms/discord.svg'
  },
  {
    id: 'tiktok-hashtag',
    label: 'Hashtag Campaign',
    icon: '/platforms/tiktok.svg'
  },
  {
    id: 'linkedin-follow',
    label: 'LinkedIn Follow Campaign',
    icon: '/platforms/linkedin.svg'
  },
  {
    id: 'bluesky-repost',
    label: 'Repost & Win',
    icon: '/platforms/bluesky.svg'
  },
  {
    id: 'twitter-engagement',
    label: 'Twitter Engagement Boost',
    icon: '/platforms/x.svg'
  },
  {
    id: 'instagram-reel',
    label: 'Reels Challenge',
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'youtube-premiere',
    label: 'Premiere Giveaway',
    icon: '/platforms/youtube.svg'
  },
  {
    id: 'twitch-bits',
    label: 'Bits Donation Contest',
    icon: '/platforms/twitch.svg'
  },
  {
    id: 'discord-event',
    label: 'Event Participation',
    icon: '/platforms/discord.svg'
  },
  {
    id: 'github-star',
    label: 'GitHub Star Giveaway',
    icon: '/platforms/github.svg'
  },
  {
    id: 'reddit-community',
    label: 'Subreddit Growth',
    icon: '/platforms/reddit.svg'
  },
  {
    id: 'facebook-share',
    label: 'Share & Tag Contest',
    icon: '/platforms/facebook.svg'
  },
  {
    id: 'tiktok-live',
    label: 'Live Stream Giveaway',
    icon: '/platforms/tiktok.svg'
  },
  {
    id: 'steam-curator',
    label: 'Steam Curator Follow',
    icon: '/platforms/steam.svg'
  },
  {
    id: 'spotify-follow',
    label: 'Spotify Follow Artist',
    icon: '/platforms/spotify.svg'
  },
  {
    id: 'bluesky-engagement',
    label: 'Engagement Boost',
    icon: '/platforms/bluesky.svg'
  },
  {
    id: 'reddit-ama',
    label: 'AMA Participation',
    icon: '/platforms/reddit.svg'
  },
  {
    id: 'patreon-join',
    label: 'Patreon Member Reward',
    icon: '/platforms/patreon.svg'
  },
  {
    id: 'linkedin-engage',
    label: 'Post Engagement Contest',
    icon: '/platforms/linkedin.svg'
  },
  {
    id: 'photo-contest',
    label: 'Photo Submission Contest',
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'video-contest',
    label: 'Video Creation Challenge',
    icon: '/platforms/youtube.svg'
  },
  {
    id: 'kick-follow',
    label: 'Kick Channel Follow',
    icon: '/platforms/kick.svg'
  },
  {
    id: 'threads-follow',
    label: 'Threads Follow Giveaway',
    icon: '/platforms/threads.svg'
  },
  {
    id: 'github-contributor',
    label: 'Contributor Reward',
    icon: '/platforms/github.svg'
  },
  {
    id: 'steam-review',
    label: 'Game Review Contest',
    icon: '/platforms/steam.svg'
  },
  {
    id: 'pinterest-follow',
    label: 'Pinterest Follow Campaign',
    icon: '/platforms/pinterest.svg'
  },
  {
    id: 'facebook-group',
    label: 'Group Member Giveaway',
    icon: '/platforms/facebook.svg'
  },
  {
    id: 'creative-writing',
    label: 'Creative Writing Contest',
    icon: '/platforms/x.svg'
  },
  {
    id: 'spotify-playlist',
    label: 'Playlist Follower Contest',
    icon: '/platforms/spotify.svg'
  },
  {
    id: 'linkedin-newsletter',
    label: 'Newsletter Subscribe',
    icon: '/platforms/linkedin.svg'
  },
  {
    id: 'fan-art',
    label: 'Fan Art Competition',
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'patreon-tier',
    label: 'Tier Upgrade Contest',
    icon: '/platforms/patreon.svg'
  },
  {
    id: 'github-issue',
    label: 'Issue Reporter Contest',
    icon: '/platforms/github.svg'
  },
  {
    id: 'kick-sub',
    label: 'Kick Subscription Contest',
    icon: '/platforms/kick.svg'
  },
  {
    id: 'caption-contest',
    label: 'Caption This Contest',
    icon: '/platforms/x.svg'
  },
  {
    id: 'steam-keys',
    label: 'Steam Keys Giveaway',
    icon: '/platforms/steam.svg'
  },
  {
    id: 'threads-repost',
    label: 'Threads Repost Contest',
    icon: '/platforms/threads.svg'
  },
  {
    id: 'trivia-quiz',
    label: 'Trivia Quiz Giveaway',
    icon: '/platforms/discord.svg'
  },
  {
    id: 'pinterest-pin',
    label: 'Pin & Save Contest',
    icon: '/platforms/pinterest.svg'
  },
  {
    id: 'spotify-share',
    label: 'Share Track Giveaway',
    icon: '/platforms/spotify.svg'
  },
  {
    id: 'email-signup',
    label: 'Email List Growth',
    icon: '/platforms/google.svg'
  },
  {
    id: 'snapchat-add',
    label: 'Snapchat Add Friend',
    icon: '/platforms/snapchat.svg'
  },
  {
    id: 'scavenger-hunt',
    label: 'Social Media Scavenger Hunt',
    icon: '/platforms/x.svg'
  },
  {
    id: 'patreon-milestone',
    label: 'Supporter Milestone',
    icon: '/platforms/patreon.svg'
  },
  {
    id: 'tumblr-follow',
    label: 'Tumblr Follow Blog',
    icon: '/platforms/tumblr.svg'
  },
  {
    id: 'newsletter-sub',
    label: 'Newsletter Subscribe',
    icon: '/platforms/google.svg'
  },
  {
    id: 'pinterest-board',
    label: 'Board Follower Giveaway',
    icon: '/platforms/pinterest.svg'
  },
  {
    id: 'milestone-10k',
    label: '10K Followers Celebration',
    icon: '/platforms/x.svg'
  },
  {
    id: 'product-launch',
    label: 'Product Launch Contest',
    icon: '/platforms/producthunt.svg'
  },
  {
    id: 'snapchat-story',
    label: 'Story View Contest',
    icon: '/platforms/snapchat.svg'
  },
  {
    id: 'website-visit',
    label: 'Website Traffic Boost',
    icon: '/platforms/google.svg'
  },
  {
    id: 'milestone-50k',
    label: '50K Subscribers Milestone',
    icon: '/platforms/youtube.svg'
  },
  { id: 'tumblr-reblog', label: 'Reblog & Win', icon: '/platforms/tumblr.svg' },
  {
    id: 'gaming-tournament',
    label: 'Gaming Tournament',
    icon: '/platforms/twitch.svg'
  },
  {
    id: 'product-upvote',
    label: 'Product Hunt Upvote',
    icon: '/platforms/producthunt.svg'
  },
  {
    id: 'referral-contest',
    label: 'Referral Program',
    icon: '/platforms/google.svg'
  },
  {
    id: 'milestone-100k',
    label: '100K Community Celebration',
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'esports-bracket',
    label: 'Esports Bracket Challenge',
    icon: '/platforms/twitch.svg'
  },
  {
    id: 'birthday-bash',
    label: 'Birthday Bash Giveaway',
    icon: '/platforms/x.svg'
  },
  {
    id: 'game-keys',
    label: 'Game Keys Giveaway',
    icon: '/platforms/steam.svg'
  },
  {
    id: 'anniversary',
    label: 'Anniversary Special',
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'console-giveaway',
    label: 'Gaming Console Giveaway',
    icon: '/platforms/twitch.svg'
  },
  {
    id: 'holiday-christmas',
    label: 'Christmas Giveaway',
    icon: '/platforms/x.svg'
  },
  {
    id: 'merch-drop',
    label: 'Limited Edition Merch',
    icon: '/platforms/x.svg'
  },
  {
    id: 'holiday-halloween',
    label: 'Halloween Contest',
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'signed-item',
    label: 'Autographed Item Contest',
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'holiday-valentine',
    label: "Valentine's Day Special",
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'mystery-box',
    label: 'Mystery Box Giveaway',
    icon: '/platforms/youtube.svg'
  },
  { id: 'black-friday', label: 'Black Friday Deals', icon: '/platforms/x.svg' },
  {
    id: 'bundle-deal',
    label: 'Product Bundle Contest',
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'cyber-monday',
    label: 'Cyber Monday Contest',
    icon: '/platforms/x.svg'
  },
  {
    id: 'early-access',
    label: 'Early Access Pass',
    icon: '/platforms/discord.svg'
  },
  { id: 'new-year', label: 'New Year Giveaway', icon: '/platforms/x.svg' },
  {
    id: 'beta-tester',
    label: 'Beta Tester Recruitment',
    icon: '/platforms/discord.svg'
  },
  {
    id: 'back-to-school',
    label: 'Back to School Contest',
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'community-vote',
    label: 'Community Vote Contest',
    icon: '/platforms/discord.svg'
  },
  {
    id: 'summer-giveaway',
    label: 'Summer Vacation Giveaway',
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'poll-winner',
    label: 'Poll Winner Giveaway',
    icon: '/platforms/x.svg'
  },
  {
    id: 'user-generated',
    label: 'User Generated Content',
    icon: '/platforms/instagram.svg'
  },
  {
    id: 'testimonial-contest',
    label: 'Testimonial Contest',
    icon: '/platforms/google.svg'
  },
  { id: 'review-reward', label: 'Review & Win', icon: '/platforms/google.svg' },
  {
    id: 'survey-entry',
    label: 'Survey Participation',
    icon: '/platforms/google.svg'
  },
  {
    id: 'feedback-form',
    label: 'Feedback Form Contest',
    icon: '/platforms/google.svg'
  },
  {
    id: 'loyalty-program',
    label: 'Loyalty Program Reward',
    icon: '/platforms/google.svg'
  },
  {
    id: 'vip-access',
    label: 'VIP Access Giveaway',
    icon: '/platforms/discord.svg'
  },
  {
    id: 'exclusive-content',
    label: 'Exclusive Content Access',
    icon: '/platforms/patreon.svg'
  },
  {
    id: 'collab-contest',
    label: 'Creator Collaboration',
    icon: '/platforms/youtube.svg'
  },
  {
    id: 'charity-drive',
    label: 'Charity Fundraiser',
    icon: '/platforms/twitch.svg'
  },
  {
    id: 'donation-match',
    label: 'Donation Matching Contest',
    icon: '/platforms/twitch.svg'
  }
];

interface TemplatePillProps {
  template: Template;
}

const TemplatePill = ({ template }: TemplatePillProps) => {
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
          src={template.icon}
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
}

export const ScrollingTemplatesAnimation = ({
  className
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
      <div className="flex flex-col gap-1 py-4">
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
