import db from '@/lib/prisma';
import { scheduleRandomlyAssignPrizesJob } from '@/lib/jobs/util';
import type { DiscordMemberSchema } from '../../../bot/schema';
import type { DiscordScoringData } from '@/lib/scoring/schemas';

const toDiscordScoringData = (
  member: DiscordMemberSchema
): DiscordScoringData => ({
  userId: member.user.id,
  username: member.user.username,
  avatar: member.avatar || member.user.avatar,
  banner: member.banner,
  joinedAt: member.joined_at,
  premiumSince: member.premium_since,
  communicationDisabledUntil: member.communication_disabled_until,
  unusualDmActivityUntil: member.unusual_dm_activity_until
});

export async function scheduleRewards({
  sweepstakesId,
  userId,
  member
}: {
  sweepstakesId: string;
  userId: string;
  member: DiscordMemberSchema;
}): Promise<void> {
  'use step';

  await scheduleRandomlyAssignPrizesJob({ db, sweepstakesId });

  await db.userScoringRequest.upsert({
    where: { userId },
    create: {
      userId,
      data: toDiscordScoringData(member)
    },
    update: {
      data: toDiscordScoringData(member),
      updatedAt: new Date()
    }
  });
}
