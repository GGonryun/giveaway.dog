'use client';

import React from 'react';
import {
  GiveawayParticipationProvider,
  GiveawayParticipationProps
} from './giveaway-participation-context';
import { GiveawayParticipationHeader } from './giveaway-participation-header';
import { NotLoggedIn } from './states/not-logged-in';
import { ProfileIncomplete } from './states/profile-incomplete';
import { NotEligible } from './states/not-eligible';
import { WinnersAnnounced } from './states/winners-announced';
import { ActiveParticipation } from './states/active-participation';
import { useGiveawayParticipation } from './giveaway-participation-context';

const GiveawayParticipationContent = () => {
  const { state } = useGiveawayParticipation();

  switch (state) {
    case 'not-logged-in':
      return <NotLoggedIn />;
    case 'profile-incomplete':
      return <ProfileIncomplete />;
    case 'not-eligible':
      return <NotEligible />;
    case 'winners-announced':
      return <WinnersAnnounced />;
    case 'active':
      return <ActiveParticipation />;
    default:
      return <div>Error, unknown participation state</div>;
  }
};

const GiveawayParticipationContainer = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 *:w-full">
      <GiveawayParticipationHeader>
        <GiveawayParticipationContent />
      </GiveawayParticipationHeader>
    </div>
  );
};

export const GiveawayParticipation: React.FC<GiveawayParticipationProps> = ({
  participation,
  sweepstakes,
  host,
  winners,
  user,
  state = 'active',
  onTaskComplete,
  onLogin,
  onCompleteProfile
}) => {
  return (
    <GiveawayParticipationProvider
      sweepstakes={sweepstakes}
      participation={participation}
      winners={winners}
      host={host}
      user={user}
      state={state}
      onTaskComplete={onTaskComplete}
      onLogin={onLogin}
      onCompleteProfile={onCompleteProfile}
    >
      <GiveawayParticipationContainer />
    </GiveawayParticipationProvider>
  );
};

export default GiveawayParticipation;
