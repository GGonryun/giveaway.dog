import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { GiveawayFormSchema } from '../../schema';
import {
  Trash2Icon,
  CopyIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  GripVerticalIcon
} from 'lucide-react';
import React, { useMemo } from 'react';
import { FieldArrayWithId } from 'react-hook-form';
import { BaseSettings } from './base-settings';
import { IconButton } from './icon-button';
import { toTheme } from './task-theme';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { AdditionalSettings } from './additional-settings';
import { AdvancedSettings } from './advanced-settings';

export const EntryMethod: React.FC<
  FieldArrayWithId<GiveawayFormSchema, 'tasks'> & {
    onRemove: () => void;
    onCopy: () => void;
  }
> = ({ onRemove, onCopy, ...field }) => {
  const [open, setOpen] = React.useState(true);
  const theme = useMemo(() => toTheme(field.type), [field.type]);
  return (
    <div className="relative flex items-center group">
      <GripVerticalIcon className="absolute -left-4 text-muted-foreground size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-2 border shadow-sm rounded-lg overflow-hidden w-full">
        <Collapsible className="flex-grow" open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <div className="flex flex-grow py-1 pl-2 pr-1 w-full justify-between items-center cursor-pointer bg-primary text-primary-foreground">
              <div className="flex gap-2 items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-6 h-6 p-0.5 rounded-md border',
                    theme.symbol
                  )}
                >
                  <theme.icon />
                </div>
                <Typography.Paragraph weight="medium">
                  {theme.label}
                </Typography.Paragraph>
              </div>
              <div className="flex items-center gap-1">
                <IconButton
                  onClick={() => {
                    onRemove();
                  }}
                  icon={Trash2Icon}
                />
                <IconButton
                  onClick={() => {
                    onCopy();
                  }}
                  icon={CopyIcon}
                />
                <IconButton icon={open ? ChevronUpIcon : ChevronDownIcon} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-3 pt-1.5 border-t space-y-2">
            <BaseSettings />
            <AdditionalSettings type={field.type} />
            <AdvancedSettings type={field.type} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};
