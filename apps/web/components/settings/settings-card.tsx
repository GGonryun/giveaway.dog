'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SettingsCardProps {
  title: string;
  variant?: 'default' | 'destructive';
  description?: string;
  children?: ReactNode;
  accent?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  onSave?: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  accent,
  action,
  variant = 'default',
  children,
  footer,
  onSave,
  isSaving = false,
  hasChanges = false
}) => {
  return (
    <Card
      className={cn(variant === 'destructive' && 'border border-destructive')}
    >
      <CardHeader className="flex justify-between items-center">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && (
            <CardDescription className="mt-1">{description}</CardDescription>
          )}
        </div>
        {accent && <div>{accent}</div>}
      </CardHeader>
      <CardContent
        className={cn(children ? (footer ? 'py-2' : 'pt-2') : 'p-0')}
      >
        {children}
      </CardContent>
      {footer && (
        <CardFooter
          className={cn(
            'flex flex-col items-start gap-3 border-t sm:flex-row sm:items-center sm:justify-between py-0 my-0 text-sm sm:leading-8 text-muted-foreground',
            variant === 'destructive' &&
              'border-destructive dark:text-destructive'
          )}
        >
          {footer ? footer : <div />}
          {action ? (
            action
          ) : (
            <Button
              size="sm"
              onClick={onSave}
              disabled={isSaving || hasChanges === false}
              className={cn('w-full sm:w-auto', !onSave && 'hidden')}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};
