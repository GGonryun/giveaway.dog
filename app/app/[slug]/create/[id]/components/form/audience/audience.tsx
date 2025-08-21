'use client';

import React from 'react';
import { RegionalRestriction } from './regional-restriction';
import { MinimumAgeRestriction } from './minimum-age-restriction';
import { RequireEmail } from './require-email';
import { Section } from '../section';

export const Audience = () => {
  return (
    <Section
      label="Audience"
      description="Select the requirements for user participation."
    >
      <RequireEmail />

      <RegionalRestriction />

      <MinimumAgeRestriction />
    </Section>
  );
};
