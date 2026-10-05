'use client';

import React, { useMemo } from 'react';
import {
  GiveawayParticipationProvider,
  GiveawayParticipationProps
} from '@giveaway/sweepstakes-participation-core/giveaway-participation-context';
import { GiveawayParticipationCard } from './giveaway-participation-card';

import { NotEligible } from '@giveaway/sweepstakes-participation-states/not-eligible';
import { WinnersAnnouncedParticipation } from '@giveaway/sweepstakes-participation-states/winners-announced-participation';
import { ActiveParticipation } from '@giveaway/sweepstakes-participation-states/active/active-participation';
import { Cancelled } from '@giveaway/sweepstakes-participation-states/cancelled';
import { Closed } from '@giveaway/sweepstakes-participation-states/closed';
import { Error } from '@giveaway/sweepstakes-participation-states/error';
import { Pending } from '@giveaway/sweepstakes-participation-states/pending';
import { useGiveawayParticipation } from '@giveaway/sweepstakes-participation-core/giveaway-participation-context';
import { assertNever } from '@giveaway/util-errors';
import { toBackgroundStyle } from '@giveaway/sweepstakes-model/color';
import { cn } from '@giveaway/ui-utils/utils';
import { SweepstakesLoginOptions } from '@giveaway/sweepstakes-participation-core/sweepstakes-login-options';
import { UserDetailsForm } from '@giveaway/sweepstakes-participation-states/user-details-form';
import { TurnstileGate } from '@giveaway/turnstile-ui/gate';

const GiveawayParticipationContent = () => {
  const { state, sweepstakes } = useGiveawayParticipation();
  const { requirePreEntryLogin } = sweepstakes.audience;

  switch (state) {
    case 'not-logged-in':
      return requirePreEntryLogin ? (
        <SweepstakesLoginOptions />
      ) : (
        <ActiveParticipation />
      );
    case 'pending':
      return <Pending />;
    case 'profile-incomplete':
      return <UserDetailsForm />;
    case 'not-eligible':
      return <NotEligible />;
    case 'winners-announced':
      return <WinnersAnnouncedParticipation />;
    case 'no-prize-allocation':
    case 'active':
      return <ActiveParticipation />;
    case 'canceled':
      return <Cancelled />;
    case 'closed':
      return <Closed />;
    case 'error':
      return <Error />;
    case 'winners-pending':
      return <ActiveParticipation />;

    default:
      throw assertNever(state);
  }
};

const GiveawayParticipationContentGate = () => {
  return (
    <TurnstileGate>
      <GiveawayParticipationContent />
    </TurnstileGate>
  );
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
              <GiveawayParticipationContentGate />
            </GiveawayParticipationCard>
          </GiveawayParticipationProvider>
        </div>
      </div>
    </div>
  );
};

export default GiveawayParticipation;
