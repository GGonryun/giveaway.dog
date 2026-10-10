import 'server-only';

import { nanoid } from 'nanoid';
import { PrismaClient } from '@giveaway/db-model';
import { E2ePickerRequest } from '@giveaway/e2e-model/extras';
import { findE2eTeam } from './ownership';

const DAY_MS = 24 * 60 * 60 * 1000;

export const toE2eTweetUrl = (tweetId: string) =>
  `https://x.com/e2e/status/${tweetId}`;

export const seedE2ePicker = async ({
  db,
  request,
  now
}: {
  db: PrismaClient;
  request: E2ePickerRequest;
  now: Date;
}) => {
  const { team: slug, users, posts, draws, runIn, ...settings } = request;
  const team = await findE2eTeam(db, slug);
  const pickerId = nanoid();
  const tweets = posts.map((post, index) => ({
    ...post,
    id: nanoid(),
    tweetId: `${pickerId}-${index}`,
    userId: 'e2e',
    username: 'e2e',
    createdAt: now,
    pickerId
  }));
  const pickerUsers = users.map(({ createdDaysAgo, ...user }, index) => ({
    ...user,
    id: nanoid(),
    userId: `${pickerId}-${index}`,
    createdAt:
      createdDaysAgo === undefined
        ? null
        : new Date(now.getTime() - createdDaysAgo * DAY_MS),
    pickerId
  }));
  const pickerDraws = draws.map((draw) => ({
    id: nanoid(),
    pickerId,
    userId: pickerUsers[draw.user].id,
    disqualified: draw.disqualified
  }));

  await db.$transaction([
    db.twitterPicker.create({
      data: {
        ...settings,
        id: pickerId,
        teamId: team.id,
        tweetUrls: tweets.map((tweet) => toE2eTweetUrl(tweet.tweetId)),
        runAt:
          runIn === undefined ? null : new Date(now.getTime() + runIn * 1000)
      }
    }),
    db.twitterPost.createMany({ data: tweets }),
    db.twitterPickerUser.createMany({ data: pickerUsers }),
    db.twitterPickerDraw.createMany({ data: pickerDraws })
  ]);

  return {
    id: pickerId,
    team: team.slug,
    status: request.status,
    users: pickerUsers.map((user) => ({
      id: user.id,
      username: user.username
    })),
    posts: tweets.map((tweet) => ({ id: tweet.id, tweetId: tweet.tweetId })),
    draws: pickerDraws.map((draw) => ({
      id: draw.id,
      userId: draw.userId,
      disqualified: draw.disqualified ?? null
    }))
  };
};
