'use client';

import { SectionTitle } from '../section-title';
import React from 'react';
import { RegionalRestriction } from './regional-restriction';
import { RequirePreEntryLogin } from './require-pre-entry-login';
import { MinimumAgeRestriction } from './minimum-age-restriction';
import { RequireEmail } from './require-email';

export const Audience = () => {
  return (
    <>
      <SectionTitle
        label="Audience"
        description="Select the requirements for user participation."
      />

      <RequireEmail />

      <RequirePreEntryLogin />

      <RegionalRestriction />

      <MinimumAgeRestriction />
    </>
  );
};
