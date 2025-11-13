'use client';

import React, { useMemo } from 'react';
import {
  GiveawayParticipationProvider,
  GiveawayParticipationProps
} from './giveaway-participation-context';
import { GiveawayParticipationCard } from './giveaway-participation-card';

import { EmailRequired } from './states/email-required';
import { NotEligible } from './states/not-eligible';
import { WinnersAnnounced } from './states/winners-announced';
import { ActiveParticipation } from './states/active/active-participation';
import { Cancelled } from './states/cancelled';
import { Closed } from './states/closed';
import { Error } from './states/error';
import { WinnersPending } from './states/winners-pending';
import { ProfileIncomplete } from './states/profile-incomplete';
import { AgeVerificationRequired } from './states/age-verification-required';
import { Pending } from './states/pending';
import { useGiveawayParticipation } from './giveaway-participation-context';
import { assertNever } from '@/lib/errors';
import { toBackgroundStyle } from '@/schemas/color';
import { cn } from '@/lib/utils';

const GiveawayParticipationContent = () => {
  const { state } = useGiveawayParticipation();

  switch (state) {
    case 'not-logged-in':
      return <ActiveParticipation />;
    case 'pending':
      return <Pending />;
    case 'email-required':
      return <EmailRequired />;
    case 'age-verification-required':
      return <AgeVerificationRequired />;
    case 'not-eligible':
      return <NotEligible />;
    case 'winners-announced':
      return <WinnersAnnounced />;
    case 'active':
      return <ActiveParticipation />;
    case 'canceled':
      return <Cancelled />;
    case 'closed':
      return <Closed />;
    case 'error':
      return <Error />;
    case 'winners-pending':
      return <WinnersPending />;
    case 'profile-incomplete':
      return <ProfileIncomplete />;
    default:
      throw assertNever(state);
  }
};

export const GiveawayParticipation: React.FC<GiveawayParticipationProps> = ({
  hideBackground,
  className,
  ...props
}) => {
  const bg = useMemo(
    () => toBackgroundStyle(props.sweepstakes.design.background),
    [props.sweepstakes.design.background]
  );
  return (
    <div
      className={cn('overflow-auto w-full flex-1 p-2 sm:p-4 flex', className)}
      style={
        hideBackground
          ? {}
          : {
              background: bg
            }
      }
    >
      <div className="mx-auto my-auto w-full max-w-2xl min-w-fit">
        <div className="w-full max-w-2xl mx-auto">
          <GiveawayParticipationProvider {...props}>
            <GiveawayParticipationCard device={props.device}>
              <GiveawayParticipationContent />
            </GiveawayParticipationCard>
          </GiveawayParticipationProvider>
        </div>
      </div>
    </div>
  );
};

export default GiveawayParticipation;
