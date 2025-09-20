import { DeepPartial } from '@/lib/types';
import { ParticipantSweepstakesGetPayload } from './db';
import { GiveawayWinnerSchema } from './schemas';

export const toSweepstakesWinners = (
  prizes: ParticipantSweepstakesGetPayload['prizes']
): DeepPartial<GiveawayWinnerSchema>[] => {
  return prizes.map((p) => ({
    prizeId: p.id,
    prizeName: p.name ?? undefined,
    winners: toWinners(p.winners)
  }));
};

const toWinners = (
  winners: ParticipantSweepstakesGetPayload['prizes'][number]['winners']
): DeepPartial<GiveawayWinnerSchema['winners']> => {
  return winners.map((w) => ({
    id: w.userId,
    name: w.user.name ?? undefined,
    email: w.user.email ?? undefined,
    emoji: w.user.emoji ?? undefined,
    countryCode: w.user.countryCode ?? undefined,
    ageVerified: w.user.ageVerified ?? undefined
  }));
};
