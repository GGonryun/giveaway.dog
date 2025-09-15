'use client';

import React from 'react';
import {
  GiveawayParticipationProvider,
  GiveawayParticipationProps
} from './giveaway-participation-context';
import { GiveawayParticipationHeader } from './giveaway-participation-header';
import { NotLoggedIn } from './states/not-logged-in';
import { EmailRequired } from './states/email-required';
import { NotEligible } from './states/not-eligible';
import { WinnersAnnounced } from './states/winners-announced';
import { ActiveParticipation } from './states/active/active-participation';
import { Cancelled } from './states/cancelled';
import { Closed } from './states/closed';
import { Error } from './states/error';
import { WinnersPending } from './states/winners-pending';
import { ProfileIncomplete } from './states/profile-incomplete';
import { useGiveawayParticipation } from './giveaway-participation-context';
import { assertNever } from '@/lib/errors';

const GiveawayParticipationContent = () => {
  const { state } = useGiveawayParticipation();

  switch (state) {
    case 'not-logged-in':
      return <NotLoggedIn />;
    case 'email-required':
      return <EmailRequired />;
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

export const GiveawayParticipation: React.FC<GiveawayParticipationProps> = (
  props
) => {
  return (
    <GiveawayParticipationProvider {...props}>
      <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 *:w-full">
        <GiveawayParticipationHeader>
          <GiveawayParticipationContent />
        </GiveawayParticipationHeader>
      </div>
    </GiveawayParticipationProvider>
  );
};

export default GiveawayParticipation;
