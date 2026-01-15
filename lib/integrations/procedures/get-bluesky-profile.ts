'use server';

import { ApplicationError } from '@/lib/errors';
import { Agent } from '@atproto/api';
import { BlueskyScoringData } from '@/schemas/platform-scoring';

export interface EnhancedBlueskyProfile extends BlueskyScoringData {}

/**
 * Fetches enhanced Bluesky profile data including metrics for risk scoring.
 * Uses the AT Protocol's app.bsky.actor.getProfile endpoint.
 *
 * @param agent - Authenticated Bluesky agent
 * @param actor - DID or handle of the user to fetch
 * @returns Enhanced profile with followers, posts, creation date, etc.
 * @throws ApplicationError if profile not found or API fails
 */
export const getEnhancedBlueskyProfile = async (
  agent: Agent,
  actor: string
): Promise<EnhancedBlueskyProfile> => {
  try {
    const profileResponse = await agent.getProfile({ actor });

    if (!profileResponse.success) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Bluesky profile not found'
      });
    }

    const profile = profileResponse.data;

    return {
      did: profile.did,
      handle: profile.handle,
      displayName: profile.displayName,
      description: profile.description,
      avatar: profile.avatar,
      banner: profile.banner,
      followersCount: profile.followersCount,
      followsCount: profile.followsCount,
      postsCount: profile.postsCount,
      createdAt: profile.createdAt
    };
  } catch (error) {
    // If it's already an ApplicationError, re-throw it
    if (error instanceof ApplicationError) {
      throw error;
    }

    // Otherwise wrap in ApplicationError
    console.error('Error fetching enhanced Bluesky profile:', error);
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch Bluesky profile data',
      cause: error
    });
  }
};

/**
 * Batch fetches enhanced profiles for multiple users.
 * Useful when importing multiple Bluesky users at once.
 *
 * @param agent - Authenticated Bluesky agent
 * @param actors - Array of DIDs or handles
 * @returns Map of actor -> enhanced profile (only successful fetches)
 */
export const getBatchBlueskyProfiles = async (
  agent: Agent,
  actors: string[]
): Promise<Map<string, EnhancedBlueskyProfile>> => {
  const profiles = new Map<string, EnhancedBlueskyProfile>();

  // Fetch profiles with concurrency limit to avoid rate limiting
  const CONCURRENCY_LIMIT = 5;
  const chunks = [];

  for (let i = 0; i < actors.length; i += CONCURRENCY_LIMIT) {
    chunks.push(actors.slice(i, i + CONCURRENCY_LIMIT));
  }

  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map((actor) => getEnhancedBlueskyProfile(agent, actor))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const actor = chunk[index];
        profiles.set(actor, result.value);
      } else {
        console.error(
          `Failed to fetch profile for ${chunk[index]}:`,
          result.reason
        );
      }
    });
  }

  return profiles;
};
