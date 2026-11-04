'use client';

import { Button } from '@giveaway/ui-primitives/button';
import { ArrowRight } from 'lucide-react';
import { UserAccountType } from '@giveaway/db-model';
import { ACCOUNT_TYPE_OPTIONS } from '@giveaway/user-model/onboarding';
import { useState } from 'react';
import { Card, CardContent } from '@giveaway/ui-primitives/card';
import { cn } from '@giveaway/ui-utils/utils';
import {
  RadioGroup,
  RadioGroupItem
} from '@giveaway/ui-primitives/radio-group';

interface AccountTypeStepProps {
  initialAccountType?: UserAccountType;
  onNext: (accountType: UserAccountType) => void;
}

export const AccountTypeStep: React.FC<AccountTypeStepProps> = ({
  initialAccountType = UserAccountType.PARTICIPANT,
  onNext
}) => {
  const [selectedType, setSelectedType] =
    useState<UserAccountType>(initialAccountType);

  const handleNext = () => {
    onNext(selectedType);
  };

  return (
    <div className="grid gap-6">
      <RadioGroup
        aria-label="Account type"
        value={selectedType}
        onValueChange={(value) => setSelectedType(value as UserAccountType)}
        className="grid gap-3"
      >
        {Object.entries(ACCOUNT_TYPE_OPTIONS).map(([type, config]) => {
          const accountType = type as UserAccountType;
          const isSelected = selectedType === accountType;
          const id = `account-type-${type.toLowerCase()}`;

          return (
            <Card
              key={type}
              className={cn(
                'p-0 transition-all hover:border-primary has-[:focus-visible]:border-primary',
                isSelected && 'border-primary bg-primary/5'
              )}
            >
              <label
                htmlFor={id}
                className="flex cursor-pointer items-start gap-4 px-6 py-6"
              >
                <span className="text-4xl" aria-hidden="true">
                  {config.emoji}
                </span>
                <span className="flex-1 space-y-1">
                  <span id={`${id}-title`} className="block font-semibold">
                    {config.title}
                  </span>
                  <span
                    id={`${id}-description`}
                    className="block text-sm text-muted-foreground"
                  >
                    {config.description}
                  </span>
                </span>
                <RadioGroupItem
                  id={id}
                  value={accountType}
                  aria-labelledby={`${id}-title`}
                  aria-describedby={`${id}-description`}
                  className="mt-1"
                />
              </label>
            </Card>
          );
        })}
      </RadioGroup>

      <Button onClick={handleNext} className="w-full">
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};
