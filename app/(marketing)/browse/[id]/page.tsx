import { SweepstakesParticipationPage } from '@/components/sweepstakes-browse/sweepstakes-participation-page-content';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import { notFound } from 'next/navigation';
import getUserSweepstakesParticipation from '@/procedures/browse/get-user-sweepstakes-participation';
import findUser from '@/procedures/user/find-user';
import {
  GiveawayState,
  ParticipantSweepstakeSchema
} from '@/schemas/giveaway/schemas';
import { UserProfileSchema } from '@/schemas/user';
import { assertNever } from '@/lib/errors';
import { dates } from '@/lib/date';
import { RequiredFields } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const result = await getParticipantSweepstake({ id });
  const user = await findUser();
  const participation = await getUserSweepstakesParticipation({ id });
  if (!result.ok || !participation.ok || !user.ok) {
    notFound();
  }
  const userProfile = user.data ?? undefined;
  const sweepstakes = result.data.sweepstakes;

  return (
    <SweepstakesParticipationPage
      {...result.data}
      state={computeState({ sweepstakes, userProfile })}
      userProfile={userProfile}
      userParticipation={participation.data}
    />
  );
}

type ComputeStateOptions = {
  sweepstakes: ParticipantSweepstakeSchema['sweepstakes'];
  userProfile?: UserProfileSchema;
};

const computeState = ({
  sweepstakes,
  userProfile
}: ComputeStateOptions): GiveawayState => {
  if (!userProfile) return 'not-logged-in';
  if (requiresEmail({ sweepstakes, userProfile })) return 'email-required';
  if (!isProfileComplete({ sweepstakes, userProfile }))
    return 'profile-incomplete';
  if (!isEligible({ sweepstakes, userProfile })) return 'not-eligible';

  switch (sweepstakes.status) {
    case 'DRAFT':
      return 'closed';
    case 'PAUSED':
      return 'closed';
    case 'CANCELED':
      return 'canceled';
    case 'ACTIVE': {
      if (dates.hasExpired(sweepstakes.timing.endDate))
        return 'winners-pending';
      return 'active';
    }
    case 'COMPLETED':
      return 'winners-announced';
    default:
      throw assertNever(sweepstakes.status);
  }
};

const requiresEmail = ({ sweepstakes, userProfile }: ComputeStateOptions) => {
  return (
    sweepstakes.audience.requireEmail &&
    (!userProfile?.email || !userProfile?.emailVerified)
  );
};

const isProfileComplete = ({
  sweepstakes,
  userProfile
}: RequiredFields<ComputeStateOptions, 'userProfile'>) => {
  if (!sweepstakes.audience.minimumAgeRestriction) return true;
  if (!userProfile.age) return false;

  if (!sweepstakes.audience.regionalRestriction) return true;
  if (!userProfile.region) return false;

  return true;
};

const isEligible = ({
  sweepstakes,
  userProfile
}: RequiredFields<ComputeStateOptions, 'userProfile'>) => {
  if (sweepstakes.audience.minimumAgeRestriction) {
    if (!userProfile.age) return false;
    if (userProfile.age < sweepstakes.audience.minimumAgeRestriction.value)
      return false;
  }

  // check if region requirement is met
  if (sweepstakes.audience.regionalRestriction) {
    if (!userProfile.region) return false;
    const hasRegion = sweepstakes.audience.regionalRestriction.regions.includes(
      userProfile.region
    );
    switch (sweepstakes.audience.regionalRestriction.filter) {
      case 'INCLUDE':
        return hasRegion;
      case 'EXCLUDE':
        return !hasRegion;
      default:
        throw assertNever(sweepstakes.audience.regionalRestriction.filter);
    }
  }
  return true;
};
