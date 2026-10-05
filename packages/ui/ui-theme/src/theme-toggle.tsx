'use client';

import { useTheme } from 'next-themes';
import { Label } from '@giveaway/ui-primitives/label';
import {
  RadioGroup,
  RadioGroupItem
} from '@giveaway/ui-primitives/radio-group';
import { SettingsCard } from '@giveaway/ui-layouts/settings-card';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <SettingsCard
      title="Appearance"
      description="Choose how the app looks on this device"
    >
      <RadioGroup className="max-w-2xl" value={theme} onValueChange={setTheme}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="light" id="light" />
          <Label htmlFor="light">Light</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="dark" id="dark" />
          <Label htmlFor="dark">Dark</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="system" id="system" />
          <Label htmlFor="system">System</Label>
        </div>
      </RadioGroup>
    </SettingsCard>
  );
}
