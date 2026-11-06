import { CompletionStatus, UserSource } from '@giveaway/db-model';

export type EligibilityCriteria = {
  minQualityScore: number;
  minTasksCompleted: number;
  allowMultipleWins: boolean;
  externalPlatforms?: UserSource[] | null;
};

export type EligibilityParticipant = {
  user: {
    id: string;
    qualityScore: number;
    source: UserSource;
  };
  completions: { status: CompletionStatus }[];
};

export type EligibilityDraw = {
  participant: { id: string };
};

export const countEligibleCompletions = (participant: EligibilityParticipant) =>
  participant.completions.filter(
    (completion) => completion.status !== CompletionStatus.REJECTED
  ).length;

export const isEligibleParticipant =
  (args: {
    criteria: EligibilityCriteria;
    drawnUserIds: ReadonlySet<string>;
  }) =>
  (participant: EligibilityParticipant) => {
    const { criteria, drawnUserIds } = args;
    const { externalPlatforms } = criteria;

    if (
      externalPlatforms &&
      externalPlatforms.length > 0 &&
      !externalPlatforms.includes(participant.user.source)
    ) {
      return false;
    }

    if (participant.user.qualityScore < criteria.minQualityScore) return false;

    if (countEligibleCompletions(participant) < criteria.minTasksCompleted)
      return false;

    if (!criteria.allowMultipleWins && drawnUserIds.has(participant.user.id))
      return false;

    return true;
  };

export const toEligibleParticipants = <T extends EligibilityParticipant>(args: {
  participants: T[];
  criteria: EligibilityCriteria;
  draws: EligibilityDraw[];
}): T[] => {
  const drawnUserIds = new Set(args.draws.map((draw) => draw.participant.id));

  return args.participants.filter(
    isEligibleParticipant({ criteria: args.criteria, drawnUserIds })
  );
};
