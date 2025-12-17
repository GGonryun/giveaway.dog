'use server';

import { Agent } from '@atproto/api';
import { getBlueskyClient } from './bluesky-client';
import prisma from '@/lib/prisma';

/**
 * Get an authenticated Bluesky Agent for a given user.
 * This restores the user's Bluesky session and returns an Agent that can make API calls.
 *
 * @param userId - The user's ID in the database
 * @returns An authenticated Bluesky Agent
 * @throws Error if the user doesn't have a Bluesky account or session
 */
export async function getBlueskyAgent(userId: string): Promise<Agent> {
  // Find the user's Bluesky account
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'bluesky'
    }
  });

  if (!account) {
    throw new Error('User does not have a connected Bluesky account');
  }

  if (!account.session_state) {
    throw new Error('Bluesky session data not found');
  }

  // Parse the stored session data
  let sessionData;
  try {
    sessionData = JSON.parse(account.session_state);
  } catch (error) {
    throw new Error('Invalid Bluesky session data');
  }

  // Restore the session using the Bluesky SDK
  // This will automatically refresh tokens if needed
  const client = await getBlueskyClient();
  const session = await client.restore(account.providerAccountId);

  // Create and return an authenticated Agent
  return new Agent(session);
}

/**
 * Get the Bluesky DID for a given user.
 *
 * @param userId - The user's ID in the database
 * @returns The user's Bluesky DID, or null if not connected
 */
export async function getBlueskyDid(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'bluesky'
    }
  });

  return account?.providerAccountId ?? null;
}

/**
 * Get the Bluesky handle for a given user.
 *
 * @param userId - The user's ID in the database
 * @returns The user's Bluesky handle, or null if not connected
 */
export async function getBlueskyHandle(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'bluesky'
    }
  });

  return account?.label ?? null;
}

/**
 * Check if a user has a connected Bluesky account.
 *
 * @param userId - The user's ID in the database
 * @returns True if the user has a Bluesky account, false otherwise
 */
export async function hasBlueskyAccount(userId: string): Promise<boolean> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'bluesky'
    }
  });

  return !!account;
}
