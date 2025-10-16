'use client';

import React from 'react';
import { RegionalRestriction } from './regional-restriction';
import { MinimumAgeRestriction } from './minimum-age-restriction';
import { RequireEmail } from './require-email';
import { SweepstakesVisibility } from './sweepstakes-visibility';
import { WinnerCriteria } from './winner-criteria';
import { Section } from '../section';

export const Audience = () => {
  return (
    <>
      <Section
        label="Participation Requirements"
        description="Set the basic requirements for users to participate in your sweepstakes."
      >
        <RequireEmail />
        <RegionalRestriction />
        <MinimumAgeRestriction />
      </Section>
      <Section
        label="Visibility"
        description="Configure the public URL for your sweepstakes."
        className="border-t"
      >
        <SweepstakesVisibility />
      </Section>
      <Section
        label="Winner Selection Criteria"
        description="Set requirements for participant eligibility when selecting winners."
        className="border-t"
      >
        <WinnerCriteria />
      </Section>
    </>
  );
};
