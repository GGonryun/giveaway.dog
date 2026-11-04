import Link from 'next/link';
import { format } from 'date-fns/format';
import { TeamTier } from '@giveaway/db-model';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import { TEAM_TIER_LABEL } from '@giveaway/team-model/team/util';
import { dataRetentionDays } from '@giveaway/team-model/team/limits';

const formatDate = (date: Date) => format(date, 'MMMM d, yyyy');

export const DataRetentionNotice: React.FC<{
  tier: TeamTier;
  deletesAt: Date | null;
  deletedAt: Date | null;
}> = ({ tier, deletesAt, deletedAt }) => {
  if (deletedAt) {
    return (
      <Alert data-slot="data-retention-notice">
        <AlertTitle>The entries of this giveaway were deleted</AlertTitle>
        <AlertDescription>
          The entries were deleted on {formatDate(deletedAt)}. The winners, the
          prizes and the details of the giveaway are kept.
        </AlertDescription>
      </Alert>
    );
  }

  if (!deletesAt) return null;

  return (
    <Alert data-slot="data-retention-notice">
      <AlertTitle>
        The entries of this giveaway are deleted on {formatDate(deletesAt)}
      </AlertTitle>
      <AlertDescription>
        <p>
          {TEAM_TIER_LABEL[tier]} teams keep the entries of a giveaway for{' '}
          {dataRetentionDays(tier)} days after it ends. The winners, the prizes
          and the details of the giveaway are kept.{' '}
          <Link href="/pricing" className="text-primary underline">
            Upgrade to keep the entries longer
          </Link>
        </p>
      </AlertDescription>
    </Alert>
  );
};
