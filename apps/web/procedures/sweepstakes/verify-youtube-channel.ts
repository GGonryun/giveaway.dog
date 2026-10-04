'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { listChannelSnippetSchema } from '@giveaway/youtube-model/youtube';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';

interface YouTubeChannelParams {
  type: 'handle' | 'channelId';
  value: string;
}

function parseYouTubeChannelUrl(url: string): YouTubeChannelParams | null {
  try {
    const urlObj = new URL(url);

    if (!urlObj.hostname.includes('youtube.com')) {
      return null;
    }

    const pathname = urlObj.pathname;

    const usernameMatch = pathname.match(/^\/(@[^/]+)/);
    if (usernameMatch) {
      return {
        type: 'handle',
        value: usernameMatch[1]
      };
    }

    const channelIdMatch = pathname.match(/^\/channel\/([^/]+)/);
    if (channelIdMatch) {
      return {
        type: 'channelId',
        value: channelIdMatch[1]
      };
    }

    const directUsernameMatch = pathname.match(/^\/([A-Za-z0-9_\-]+)$/);
    if (directUsernameMatch) {
      return {
        type: 'handle',
        value: `@${directUsernameMatch[1]}`
      };
    }

    return null;
  } catch {
    return null;
  }
}

export const verifyYouTubeChannel = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      channelUrl: z.string().min(1)
    })
  )
  .output(listChannelSnippetSchema)
  .handler(async ({ input }) => {
    const channelParams = parseYouTubeChannelUrl(input.channelUrl);

    if (!channelParams) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message:
          'Invalid YouTube URL format. Please use youtube.com/@username, youtube.com/username, or youtube.com/channel/CHANNEL_ID'
      });
    }

    console.info('Checking YouTube channel with params:', channelParams);

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      console.error('YouTube API key not configured in environment variables');

      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'YouTube API key not configured'
      });
    }

    try {
      const params = new URLSearchParams({
        part: 'snippet',
        key: apiKey
      });

      if (channelParams.type === 'handle') {
        params.append('forHandle', channelParams.value);
      } else {
        params.append('id', channelParams.value);
      }

      const apiUrl = `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`;

      const response = await fetch(apiUrl, {
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('YouTube API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new ApplicationError({
          code: 'BAD_REQUEST',
          message:
            'Failed to verify YouTube channel. Please check if the channel exists or try again later.'
        });
      }

      const data = await response.json();

      console.info('YouTube API response data:', JSON.stringify(data));

      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        const parsed = listChannelSnippetSchema.safeParse(item.snippet);
        if (!parsed.success) {
          throw new ApplicationError({
            code: 'VALIDATION_ERROR',
            message: 'Failed to validate YouTube channel snippet data',
            cause: parsed.error
          });
        }
        return parsed.data;
      } else {
        throw new ApplicationError({
          code: 'BAD_REQUEST',
          silent: true,
          message:
            'YouTube channel not found. Please check if the channel exists or double check the URL.'
        });
      }
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Unable to verify YouTube channel. Please check if the channel exists or double check the URL.'
      });
    }
  });

export default verifyYouTubeChannel;
