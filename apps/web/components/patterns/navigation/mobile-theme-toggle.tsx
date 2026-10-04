'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@giveaway/ui-utils/utils';

export const MobileThemeToggle: React.FC<{ textClassName?: string }> = ({
  textClassName
}) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between">
      <span className={cn(`font-medium`, textClassName)}>Theme</span>
      <ToggleGroup
        type="single"
        value={theme}
        onValueChange={(value) => value && setTheme(value)}
        className="gap-0 border rounded-md bg-muted p-0 m-0"
      >
        <ToggleGroupItem
          value="system"
          aria-label="System theme"
          size="sm"
          className="h-7 w-7 m-0 p-0 data-[state=on]:bg-background data-[state=on]:border data-[state=on]:shadow-sm data-[state=on]:text-foreground"
        >
          <Monitor className="h-3.5 w-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="light"
          aria-label="Light theme"
          size="sm"
          className="h-7 w-7 m-0  p-0 data-[state=on]:bg-background data-[state=on]:border data-[state=on]:shadow-sm data-[state=on]:text-foreground"
        >
          <Sun className="h-3.5 w-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="dark"
          aria-label="Dark theme"
          size="sm"
          className="h-7 w-7 m-0 p-0 data-[state=on]:bg-background data-[state=on]:border data-[state=on]:shadow-sm data-[state=on]:text-foreground"
        >
          <Moon className="h-3.5 w-3.5" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
