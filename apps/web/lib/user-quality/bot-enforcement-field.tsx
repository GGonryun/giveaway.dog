'use client';

import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ENFORCEMENT_LEVELS,
  VALID_ENFORCEMENT_VALUES,
  clampToNearestEnforcementLevel,
  getEnforcementLevel
} from '@giveaway/user-quality-model/enforcement-levels';
import { ENFORCEMENT_LEVEL_ALERT_VARIANT } from './display';

interface BotEnforcementFieldProps {
  value: number;
  onChange: (value: number) => void;
  showAlert?: boolean;
}

export const BotEnforcementField: React.FC<BotEnforcementFieldProps> = ({
  value,
  onChange,
  showAlert = true
}) => {
  const normalizedValue = clampToNearestEnforcementLevel(value);
  const enforcementLevel = getEnforcementLevel(normalizedValue);

  React.useEffect(() => {
    if (value !== normalizedValue) {
      onChange(normalizedValue);
    }
  }, [value, normalizedValue, onChange]);

  return (
    <div className="space-y-4">
      <ToggleGroup
        type="single"
        value={normalizedValue.toString()}
        onValueChange={(newValue) => {
          if (newValue) {
            onChange(parseInt(newValue));
          } else {
            onChange(normalizedValue);
          }
        }}
        className="grid grid-cols-4 gap-2 w-full"
      >
        {VALID_ENFORCEMENT_VALUES.map((level) => (
          <ToggleGroupItem
            key={level}
            value={level.toString()}
            className="flex-1"
          >
            {ENFORCEMENT_LEVELS[level].label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {showAlert && (
        <Alert variant={ENFORCEMENT_LEVEL_ALERT_VARIANT[normalizedValue]}>
          <AlertDescription>{enforcementLevel.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
