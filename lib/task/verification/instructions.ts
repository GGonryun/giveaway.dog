import { UserSchema } from '@/schemas/user';
import { TaskSchema, TaskType } from '../schemas';
import { assertNever } from '@/lib/errors';
import { getProviderByTask, getProviderLabel, getProviderLink } from './utils';

export interface VerificationStep {
  step: number;
  instruction: string;
  note?: string;
}

export interface VerificationInstruction {
  title: string;
  description: string;
  steps: VerificationStep[];
}

export function getVerificationInstructions(args: {
  task: TaskSchema;
  user: Pick<UserSchema, 'name' | 'providers'>;
}): VerificationInstruction | null {
  const { task, user } = args;

  const name = user.name || 'the user';
  const provider = getProviderByTask(task.type, user.providers || []);

  switch (task.type) {
    case 'INSTAGRAM_VISIT':
      return {
        title: 'Verify Instagram Visit',
        description: `Check if ${name} visited your Instagram profile`,
        steps: [
          {
            step: 1,
            instruction: provider?.link
              ? 'Click the profile link below to open their Instagram profile'
              : 'Ask the user for their Instagram username',
            note: provider?.link
              ? undefined
              : 'User has not connected their Instagram profile'
          },
          {
            step: 2,
            instruction:
              'Check their profile activity or recent interactions with your content',
            note: 'This task is trust-based as Instagram does not provide visit tracking'
          },
          {
            step: 3,
            instruction:
              'If you believe they completed the task, click Approve. Otherwise, click Reject.'
          }
        ]
      };
    case 'INSTAGRAM_LIKE':
      return {
        title: 'Verify Instagram Like',
        description: `Check if ${name} liked your Instagram post`,
        steps: [
          {
            step: 1,
            instruction: 'Open your Instagram post in a new tab'
          },
          {
            step: 2,
            instruction: provider?.label
              ? `Check if ${provider.label} appears in the likes list`
              : `Ask the user for their Instagram username, then check if they appear in the likes list`,
            note: 'Note: Private accounts may not show likes publicly'
          },
          {
            step: 3,
            instruction:
              'If verified, click Approve. Otherwise, click Reject and provide a reason.'
          }
        ]
      };
    case 'INSTAGRAM_COMMENT':
      return {
        title: 'Verify Instagram Comment',
        description: `Check if ${name} commented on your Instagram post`,
        steps: [
          {
            step: 1,
            instruction: 'Open your Instagram post in a new tab'
          },
          {
            step: 2,
            instruction: provider?.label
              ? `Look for comments from @${provider.label}`
              : 'Ask the user for their Instagram username, then look for their comments',
            note: 'Check that the comment is appropriate and follows your guidelines'
          },
          {
            step: 3,
            instruction:
              'If verified, click Approve. Otherwise, click Reject and provide a reason.'
          }
        ]
      };
    case 'FACEBOOK_VISIT_PAGE':
      return {
        title: 'Verify Facebook Page Visit',
        description: `Check if ${name} visited your Facebook page`,
        steps: [
          {
            step: 1,
            instruction: provider?.link
              ? 'Click the profile link below to view their Facebook profile'
              : 'Ask the user for their Facebook profile URL',
            note: provider?.link
              ? undefined
              : 'User has not connected their Facebook profile'
          },
          {
            step: 2,
            instruction: 'Review their profile or recent activity if available',
            note: 'This task is trust-based as Facebook does not provide visit tracking'
          },
          {
            step: 3,
            instruction:
              'If you believe they completed the task, click Approve. Otherwise, click Reject.'
          }
        ]
      };
    case 'FACEBOOK_VIEW_POST':
      return {
        title: 'Verify Facebook Post View',
        description: `Check if ${name} viewed your Facebook post`,
        steps: [
          {
            step: 1,
            instruction: 'Open your Facebook post to review engagement metrics'
          },
          {
            step: 2,
            instruction:
              'Check if the user has liked, commented, or shared the post',
            note: 'Facebook does not show who viewed posts, so look for engagement'
          },
          {
            step: 3,
            instruction:
              'If verified, click Approve. Otherwise, click Reject and provide a reason.'
          }
        ]
      };
    case 'TIKTOK_FOLLOW':
      return {
        title: 'Verify TikTok Follow',
        description: `Check if ${name} followed your TikTok account`,
        steps: [
          {
            step: 1,
            instruction:
              'Open your TikTok profile and go to your followers list'
          },
          {
            step: 2,
            instruction: provider?.label
              ? `Search for @${provider.label} in your followers`
              : 'Ask the user for their TikTok username, then search for them in your followers',
            note: 'TikTok follower lists may be private depending on settings'
          },
          {
            step: 3,
            instruction:
              'If verified, click Approve. Otherwise, click Reject and provide a reason.'
          }
        ]
      };
    case 'TIKTOK_LIKE':
      return {
        title: 'Verify TikTok Like',
        description: `Check if ${name} liked your TikTok video`,
        steps: [
          {
            step: 1,
            instruction: 'Open your TikTok video to view likes'
          },
          {
            step: 2,
            instruction: provider?.label
              ? `Look for ${provider.label} in the likes list`
              : 'Ask the user for their TikTok username, then check the likes list',
            note: 'Note: TikTok may not show all users who liked a video'
          },
          {
            step: 3,
            instruction:
              'If verified, click Approve. Otherwise, click Reject and provide a reason.'
          }
        ]
      };
    case 'TWITTER_FOLLOW':
      return {
        title: 'Verify Twitter/X Follow',
        description: `Check if ${name} followed your Twitter/X account`,
        steps: [
          {
            step: 1,
            instruction: 'Open your Twitter/X profile and go to your followers'
          },
          {
            step: 2,
            instruction: provider?.label
              ? `Search for @${provider.label} in your followers`
              : 'Check if the user appears in your followers list',
            note: 'You can use the search function to find specific followers'
          },
          {
            step: 3,
            instruction:
              'If verified, click Approve. Otherwise, click Reject and provide a reason.'
          }
        ]
      };
    case 'TWITTER_RETWEET':
      return {
        title: 'Verify Twitter/X Retweet',
        description: `Check if ${name} retweeted your post`,
        steps: [
          {
            step: 1,
            instruction: 'Open your Twitter/X post'
          },
          {
            step: 2,
            instruction: provider?.label
              ? `Click on the retweets count and search for @${provider.label}`
              : 'Click on the retweets count to see who retweeted',
            note: 'The retweets list shows most recent retweets first'
          },
          {
            step: 3,
            instruction:
              'If verified, click Approve. Otherwise, click Reject and provide a reason.'
          }
        ]
      };
    case 'TWITTER_LIKE':
      return {
        title: 'Verify Twitter/X Like',
        description: `Check if ${name} liked your post`,
        steps: [
          {
            step: 1,
            instruction: 'Open your Twitter/X post'
          },
          {
            step: 2,
            instruction: provider?.label
              ? `Click on the likes count and search for @${provider.label}`
              : 'Click on the likes count to see who liked the post',
            note: 'The likes list shows most recent likes first'
          },
          {
            step: 3,
            instruction:
              'If verified, click Approve. Otherwise, click Reject and provide a reason.'
          }
        ]
      };
    case 'YOUTUBE_VISIT':
      return {
        title: 'Verify YouTube Visit',
        description: `Check if ${name} visited your YouTube channel or video`,
        steps: [
          {
            step: 1,
            instruction:
              'Review your YouTube analytics for recent viewer activity',
            note: 'YouTube does not provide specific viewer names'
          },
          {
            step: 2,
            instruction:
              'Check for comments, likes, or subscriptions from the user',
            note: 'This task is primarily trust-based'
          },
          {
            step: 3,
            instruction:
              'If you believe they completed the task, click Approve. Otherwise, click Reject.'
          }
        ]
      };
    case 'VISIT_URL':
      return {
        title: 'Verify URL Visit',
        description: `Check if ${name} visited the specified URL`,
        steps: [
          {
            step: 1,
            instruction:
              'Check your website analytics if available (Google Analytics, etc.)',
            note: 'This task is typically trust-based without detailed tracking'
          },
          {
            step: 2,
            instruction:
              'Look for any engagement metrics (form submissions, account creation, etc.)'
          },
          {
            step: 3,
            instruction:
              'If you believe they completed the task, click Approve. Otherwise, click Reject.'
          }
        ]
      };
    case 'ASK_QUESTION':
      return {
        title: 'Review Question Answer',
        description: `Review the answer submitted by ${name}`,
        steps: [
          {
            step: 1,
            instruction: 'Read the submitted answer in the proof section below'
          },
          {
            step: 2,
            instruction:
              'Evaluate if the answer is appropriate and meets your criteria'
          },
          {
            step: 3,
            instruction:
              'If acceptable, click Approve. If inappropriate or spam, click Reject with a reason.'
          }
        ]
      };
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
      return {
        title: 'Review Quiz Answer',
        description: `Review the answer submitted by ${name}`,
        steps: [
          {
            step: 1,
            instruction: 'Check the submitted answer in the proof section below'
          },
          {
            step: 2,
            instruction: 'Verify if the answer is correct based on your quiz'
          },
          {
            step: 3,
            instruction:
              'If correct, click Approve. If incorrect, click Reject.'
          }
        ]
      };
    case 'SUBMIT_MEDIA':
      return {
        title: 'Review Submitted Media',
        description: `Review the media submitted by ${name}`,
        steps: [
          {
            step: 1,
            instruction: 'View the submitted media in the proof section below'
          },
          {
            step: 2,
            instruction:
              'Check if the media meets your requirements and guidelines',
            note: 'Verify that content is appropriate and follows your rules'
          },
          {
            step: 3,
            instruction:
              'If acceptable, click Approve. If inappropriate or does not meet guidelines, click Reject with a reason.'
          }
        ]
      };
    case 'REFERRAL_LINK':
      return {
        title: 'Verify Referral',
        description: `Check if ${name} completed the referral task`,
        steps: [
          {
            step: 1,
            instruction: 'Check your referral tracking system for new sign-ups'
          },
          {
            step: 2,
            instruction:
              'Verify if the user has successfully referred the required number of people',
            note: 'Referral data should be in the proof section'
          },
          {
            step: 3,
            instruction:
              'If verified, click Approve. Otherwise, click Reject and provide a reason.'
          }
        ]
      };
    case 'BONUS_TASK':
    case 'BONUS_TIMED':
    case 'BONUS_LIMITED':
    case 'BONUS_LOYALTY':
    case 'BONUS_COMPLETE_PROFILE':
      return {
        title: 'Review Bonus Task',
        description: `Review the bonus task completed by ${name}`,
        steps: []
      };
    case 'STEAM_FOLLOW':
      return {
        title: 'Verify Steam Follow (Self-Reported)',
        description: `Review the proof submitted by ${name}`,
        steps: [
          {
            step: 1,
            instruction:
              'View the screenshot or proof submitted in the proof section'
          },
          {
            step: 2,
            instruction:
              'Verify that the screenshot shows they followed your Steam profile or game'
          },
          {
            step: 3,
            instruction:
              'If proof is valid, click Approve. If proof is missing or invalid, click Reject.'
          }
        ]
      };
    case 'TWITTER_CONNECT':
      return {
        title: 'Verify Twitter/X Connection',
        description: `Check if ${name} connected their Twitter/X account`,
        steps: [
          {
            step: 1,
            instruction:
              'Check if the user has a Twitter/X username in their profile'
          },
          {
            step: 2,
            instruction:
              'If they have connected Twitter/X, their username should be visible',
            note: provider?.label
              ? `User's Twitter/X username: @${provider.label}`
              : 'User has not connected Twitter/X'
          },
          {
            step: 3,
            instruction: 'If connected, click Approve. Otherwise, click Reject.'
          }
        ]
      };
    case 'KICK_FOLLOW':
      return {
        title: 'Verify Kick Follow',
        description: `Check if ${name} followed your Kick channel`,
        steps: [
          {
            step: 1,
            instruction: 'Open your Kick channel and go to your followers list'
          },
          {
            step: 2,
            instruction: provider?.label
              ? `Search for ${provider.label} in your followers`
              : 'Check if the user appears in your followers list',
            note: 'Kick may limit follower list visibility'
          },
          {
            step: 3,
            instruction:
              'If verified, click Approve. Otherwise, click Reject and provide a reason.'
          }
        ]
      };
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_RETWEET_IMPORT_V2':
    case 'TWITTER_LIKE_IMPORT':
      return {
        title: `Verify Twitter/X ${task.type === 'TWITTER_RETWEET_IMPORT' || task.type === 'TWITTER_RETWEET_IMPORT_V2' ? 'Retweet' : 'Like'} (Import)`,
        description: `This task is automatically verified via Twitter/X import`,
        steps: [
          {
            step: 1,
            instruction: 'This task uses automated import to verify engagement',
            note: 'Import jobs run periodically to check Twitter/X for users who engaged with your post'
          },
          {
            step: 2,
            instruction:
              'Check the proof section to see if import verification has completed'
          },
          {
            step: 3,
            instruction:
              'If import failed or is pending, you can manually verify by checking Twitter/X'
          }
        ]
      };
    case 'BLUESKY_LIKE_IMPORT':
    case 'BLUESKY_REPOST_IMPORT':
      return {
        title: `Verify Bluesky ${task.type === 'BLUESKY_LIKE_IMPORT' ? 'Like' : 'Repost'} (Import)`,
        description: `This task is automatically verified via Bluesky import`,
        steps: [
          {
            step: 1,
            instruction: 'This task uses automated import to verify engagement',
            note: 'Import jobs run periodically to check Bluesky for users who engaged with your post'
          },
          {
            step: 2,
            instruction:
              'Check the proof section to see if import verification has completed'
          },
          {
            step: 3,
            instruction:
              'If import failed or is pending, you can manually verify by checking Bluesky'
          }
        ]
      };
    case 'STEAM_WISHLIST':
      return {
        title: 'Verify Steam Wishlist (Automatic)',
        description: `This task is automatically verified via Steam API`,
        steps: [
          {
            step: 1,
            instruction:
              'This task is automatically verified when the user connects their Steam account',
            note: 'The system checks if the game is in their wishlist via Steam API'
          },
          {
            step: 2,
            instruction:
              'You can re-verify by clicking the "Re-verify Automatically" button',
            note: 'This will check if the game is still in their wishlist'
          },
          {
            step: 3,
            instruction:
              'If automatic verification is unavailable, manually verify by checking their Steam profile'
          }
        ]
      };

    case 'DISCORD_JOIN':
      return {
        title: 'Verify Discord Join (Automatic)',
        description: `This task is automatically verified via Discord API`,
        steps: [
          {
            step: 1,
            instruction:
              'This task is automatically verified when the user connects their Discord account',
            note: 'The system checks if they are a member of your Discord server'
          },
          {
            step: 2,
            instruction:
              'You can re-verify by clicking the "Re-verify Automatically" button',
            note: 'This will check if they are still in the server'
          },
          {
            step: 3,
            instruction:
              'If automatic verification is unavailable, manually verify by checking your Discord server members'
          }
        ]
      };

    case 'DISCORD_INTERACTION_IMPORT':
      return {
        title: 'Verify Discord Interaction (Automatic)',
        description: `This task is automatically verified when users interact via Discord`,
        steps: [
          {
            step: 1,
            instruction:
              'Users click the button in your Discord message to enter the giveaway',
            note: 'Role verification happens automatically when they click'
          },
          {
            step: 2,
            instruction:
              'The system imports their Discord profile and creates a PENDING entry',
            note: 'You can manually approve or reject entries if needed'
          },
          {
            step: 3,
            instruction:
              'If automatic verification is unavailable, manually verify by checking Discord message interactions'
          }
        ]
      };

    case 'TWITCH_FOLLOW':
      return {
        title: 'Verify Twitch Follow (Automatic)',
        description: `This task is automatically verified via Twitch API`,
        steps: [
          {
            step: 1,
            instruction:
              'This task is automatically verified when the user connects their Twitch account',
            note: 'The system checks if they follow your Twitch channel'
          },
          {
            step: 2,
            instruction:
              'You can re-verify by clicking the "Re-verify Automatically" button',
            note: 'This will check if they still follow your channel'
          },
          {
            step: 3,
            instruction:
              'If automatic verification is unavailable, manually verify by checking your Twitch followers'
          }
        ]
      };

    case 'SECRET_CODE':
    case 'SECRET_CODE_V2':
      return {
        title: 'Verify Secret Code (Automatic)',
        description: `This task is automatically verified when user enters the code`,
        steps: [
          {
            step: 1,
            instruction:
              'This task verifies automatically when user enters the correct secret code',
            note: 'The submitted code is compared against the task configuration'
          },
          {
            step: 2,
            instruction:
              'Check the proof section to see the code they submitted'
          },
          {
            step: 3,
            instruction:
              'If verification failed, ensure the user entered the exact code (case-sensitive)'
          }
        ]
      };

    case 'BLUESKY_CONNECT':
      return {
        title: 'Verify Bluesky Connection (Automatic)',
        description: `This task is automatically verified via Bluesky API`,
        steps: [
          {
            step: 1,
            instruction:
              'This task is automatically verified when the user connects their Bluesky account',
            note: 'The system validates the Bluesky handle is valid and accessible'
          },
          {
            step: 2,
            instruction:
              'Check if the user has a Bluesky handle in their profile'
          },
          {
            step: 3,
            instruction:
              'If automatic verification failed, manually verify their Bluesky profile exists'
          }
        ]
      };

    case 'BLUESKY_FOLLOW':
      return {
        title: 'Verify Bluesky Follow (Automatic)',
        description: `This task is automatically verified via Bluesky API`,
        steps: [
          {
            step: 1,
            instruction: 'This task is automatically verified via Bluesky API',
            note: 'The system checks if the user follows your Bluesky account'
          },
          {
            step: 2,
            instruction:
              'You can re-verify by clicking the "Re-verify Automatically" button'
          },
          {
            step: 3,
            instruction:
              'If automatic verification is unavailable, manually check your Bluesky followers'
          }
        ]
      };

    case 'BLUESKY_LIKE':
      return {
        title: 'Verify Bluesky Like (Automatic)',
        description: `This task is automatically verified via Bluesky API`,
        steps: [
          {
            step: 1,
            instruction: 'This task is automatically verified via Bluesky API',
            note: 'The system checks if the user liked your Bluesky post'
          },
          {
            step: 2,
            instruction:
              'You can re-verify by clicking the "Re-verify Automatically" button'
          },
          {
            step: 3,
            instruction:
              'If automatic verification is unavailable, manually check your Bluesky post likes'
          }
        ]
      };

    case 'BLUESKY_REPOST':
      return {
        title: 'Verify Bluesky Repost (Automatic)',
        description: `This task is automatically verified via Bluesky API`,
        steps: [
          {
            step: 1,
            instruction: 'This task is automatically verified via Bluesky API',
            note: 'The system checks if the user reposted your Bluesky post'
          },
          {
            step: 2,
            instruction:
              'You can re-verify by clicking the "Re-verify Automatically" button'
          },
          {
            step: 3,
            instruction:
              'If automatic verification is unavailable, manually check your Bluesky post reposts'
          }
        ]
      };
    case 'TWITCH_CHAT_IMPORT':
      return {
        title: 'Verify Twitch Chat Command (Automatic)',
        description: `This task is automatically verified via Twitch Chat`,
        steps: [
          {
            step: 1,
            instruction:
              'This task is automatically verified when the user sends the specified command in your Twitch chat',
            note: 'The system listens for the command and marks the task as complete'
          },
          {
            step: 2,
            instruction:
              'Check the proof section to see if the command was detected'
          },
          {
            step: 3,
            instruction:
              'If verification failed, ensure the user sent the exact command as specified'
          }
        ]
      };

    case 'VELORA_CONNECT':
      return {
        title: 'Verify Velora Connection (Automatic)',
        description: `This task is automatically verified via Velora API`,
        steps: [
          {
            step: 1,
            instruction:
              'This task is automatically verified when the user connects their Velora account',
            note: 'The system validates the Velora account is connected and accessible'
          },
          {
            step: 2,
            instruction:
              'Check if the user has a Velora username in their profile'
          },
          {
            step: 3,
            instruction:
              'If automatic verification failed, manually verify their Velora profile exists'
          }
        ]
      };

    case 'VELORA_FOLLOW':
      return {
        title: 'Verify Velora Follow (Automatic)',
        description: `This task is automatically verified via Velora API`,
        steps: [
          {
            step: 1,
            instruction: 'This task is automatically verified via Velora API',
            note: 'The system checks if the user follows your Velora account'
          },
          {
            step: 2,
            instruction:
              'You can re-verify by clicking the "Re-verify Automatically" button'
          },
          {
            step: 3,
            instruction:
              'If automatic verification is unavailable, manually check your Velora followers'
          }
        ]
      };

    case 'LINKEDIN_CONNECT':
      return {
        title: 'Verify LinkedIn Connection (Automatic)',
        description: `This task is automatically verified via LinkedIn API`,
        steps: [
          {
            step: 1,
            instruction:
              'This task is automatically verified when the user connects their LinkedIn account',
            note: 'The system validates the LinkedIn account is connected and accessible'
          },
          {
            step: 2,
            instruction:
              'Check if the user has a LinkedIn username in their profile'
          },
          {
            step: 3,
            instruction:
              'If automatic verification failed, manually verify their LinkedIn profile exists'
          }
        ]
      };

    case 'LINKEDIN_FOLLOW':
      return {
        title: 'Verify LinkedIn Follow (Manual)',
        description: `This task requires manual verification`,
        steps: [
          {
            step: 1,
            instruction:
              'Ask the user for their LinkedIn profile URL or username'
          },
          {
            step: 2,
            instruction: `Check your LinkedIn followers at ${task.profileUrl}`
          },
          {
            step: 3,
            instruction: 'Confirm the user appears in your followers list'
          }
        ]
      };

    default:
      throw assertNever(task);
  }
}
