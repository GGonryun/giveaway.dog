'use client';

import { Button } from '@giveaway/ui-primitives/button';
import { ArrowRight } from 'lucide-react';
import { UserAccountType } from '@prisma/client';
import { ACCOUNT_TYPE_OPTIONS } from '@/schemas/onboarding';
import { useState } from 'react';
import { Card, CardContent } from '@giveaway/ui-primitives/card';
import { cn } from '@giveaway/ui-utils/utils';

interface AccountTypeStepProps {
  onNext: (accountType: UserAccountType) => void;
}

export const AccountTypeStep: React.FC<AccountTypeStepProps> = ({ onNext }) => {
  const [selectedType, setSelectedType] = useState<UserAccountType>(
    UserAccountType.PARTICIPANT
  );

  const handleNext = () => {
    onNext(selectedType);
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        {Object.entries(ACCOUNT_TYPE_OPTIONS).map(([type, config]) => {
          const accountType = type as UserAccountType;
          const isSelected = selectedType === accountType;

          return (
            <Card
              key={type}
              className={cn(
                'cursor-pointer transition-all hover:border-primary',
                isSelected && 'border-primary bg-primary/5'
              )}
              onClick={() => setSelectedType(accountType)}
            >
              <CardContent className="px-6 py-2">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{config.emoji}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{config.title}</h3>
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button onClick={handleNext} className="w-full">
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};
