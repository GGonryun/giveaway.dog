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

const computeState = ({
  sweepstakes,
  userProfile
}: {
  sweepstakes: ParticipantSweepstakeSchema['sweepstakes'];
  userProfile?: UserProfileSchema;
}): GiveawayState => {
  if (!userProfile) return 'not-logged-in';
  if (
    sweepstakes.audience.requireEmail &&
    (!userProfile.email || !userProfile.emailVerified)
  )
    return 'email-required';

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
