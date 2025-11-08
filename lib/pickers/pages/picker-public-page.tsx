'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { PublicPickerSchema } from '../schemas/public-picker';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';
import { PickerDrawVerification } from '../components/picker-draw-verification';

export const PickerPublicPage: React.FC<{
  picker: PublicPickerSchema;
}> = ({ picker }) => {
  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="text-center space-y-2">
        <MarketingPageHeader
          icon={ShieldCheck}
          title="Draw Verification"
          description="Transparent and verifiable random winner selection"
        />
      </div>

      <PickerDrawVerification picker={picker} />

      <div className="text-center text-muted-foreground">
        <p>
          Powered by{' '}
          <Link href="/" className="font-semibold text-primary underline">
            Giveaway.dog
          </Link>
        </p>
        <p className="text-sm mt-1">Fair, transparent, and verifiable draws</p>
      </div>
    </div>
  );
};
