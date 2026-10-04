'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useGiveawayParticipation } from '../giveaway-participation-context';
import { toRegionalRestrictionDescription } from '@giveaway/sweepstakes-model/schemas';

export const NotEligible: React.FC = () => {
  const { sweepstakes } = useGiveawayParticipation();
  const { regionalRestriction, formFields } = sweepstakes.audience;

  const minimumAgeField = formFields.find((field) => field.type === 'AGE');
  const regionalRestrictionText =
    toRegionalRestrictionDescription(regionalRestriction);

  const restrictions: string[] = [];

  if (
    minimumAgeField &&
    minimumAgeField.type === 'AGE' &&
    minimumAgeField.minimum
  ) {
    restrictions.push(`Must be at least ${minimumAgeField.minimum} years old`);
  }

  if (regionalRestrictionText) {
    restrictions.push(regionalRestrictionText);
  }

  return (
    <div className="text-center my-4">
      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
      <p className="text-muted-foreground mb-4">
        You are not eligible to participate in this giveaway.
      </p>

      {restrictions.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Eligibility requirements:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {restrictions.map((restriction, index) => (
              <li key={index}>{restriction}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        If you believe this is an error, please contact{' '}
        <Link href="/contact" className="underline">
          support
        </Link>
        .
      </p>
    </div>
  );
};
