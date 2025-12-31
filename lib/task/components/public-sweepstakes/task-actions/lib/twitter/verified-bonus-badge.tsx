import { Badge } from '@/components/ui/badge';
import { SocialXBlueCheckmarkIcon } from '@/lib/integrations/components/icons/x-icon';
import {
  TwitterRetweetImportTaskSchema,
  TwitterLikeImportTaskSchema,
  TwitterRetweetTaskSchema,
  TwitterLikeTaskSchema,
  parseTwitterProofSchema
} from '@/lib/task/schemas';
import { UserTaskSubmissionSchema } from '@/schemas/giveaway/schemas';
import pluralize from 'pluralize';
import React from 'react';

interface VerifiedBonusBadgeProps {
  task:
    | TwitterRetweetTaskSchema
    | TwitterRetweetImportTaskSchema
    | TwitterLikeTaskSchema
    | TwitterLikeImportTaskSchema;
  submission: UserTaskSubmissionSchema | undefined;
}

export const VerifiedBonusBadge: React.FC<VerifiedBonusBadgeProps> = ({
  task,
  submission
}) => {
  const verifiedBonus = task.verifiedBonus ?? 0;
  if (verifiedBonus === 0) {
    return null;
  }

  const proof = submission?.proof
    ? parseTwitterProofSchema(submission.proof)
    : null;

  const Container: React.PC = ({ children }) => (
    <Badge className="bg-white border-2 border-twitter-2/50">
      <span className="flex items-center gap-1 text-twitter-2 font-medium text-base">
        {children}
      </span>
    </Badge>
  );

  if (proof) {
    return (
      <Container>
        <SocialXBlueCheckmarkIcon className="size-6" />+{verifiedBonus} bonus
        earned as verified user
      </Container>
    );
  }

  return (
    <Container>
      <SocialXBlueCheckmarkIcon className="size-6" />+{verifiedBonus} bonus{' '}
      {pluralize('entry', verifiedBonus)} for verified users
    </Container>
  );
};
