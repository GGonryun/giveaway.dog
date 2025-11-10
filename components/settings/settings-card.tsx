'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SettingsCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footerNote?: string;
  onSave?: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
  readOnly?: boolean;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  children,
  footerNote,
  onSave,
  isSaving = false,
  hasChanges = false
}) => {
  return (
    <Card>
      <CardContent>
        <div className="space-y-2">
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <div className="pb-2">{children}</div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3 border-t sm:flex-row sm:items-center sm:justify-between py-0 my-0">
        {footerNote ? (
          <p className="text-xs text-muted-foreground">{footerNote}</p>
        ) : (
          <div />
        )}
        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving || !hasChanges}
          className={cn('w-full sm:w-auto', !onSave && 'invisible')}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </CardFooter>
    </Card>
  );
};
