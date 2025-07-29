import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { TASK_GROUP, TaskType } from '../../schema';
import React from 'react';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { widetype } from '@/lib/widetype';
import { PlusIcon, ChevronRight } from 'lucide-react';
import { toTheme } from './task-theme';
import { Badge } from '@/components/ui/badge';

export const SelectTaskDialog: React.FC<{
  onSelect: (type: TaskType) => void;
}> = ({ onSelect }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className="w-full border-dashed hover:border-gray-400 hover:bg-transparent"
          onClick={() => setOpen(true)}
        >
          <PlusIcon />
          Add Entry Method
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[600px]">
        <SheetHeader className="text-left">
          <SheetTitle>Entry Methods</SheetTitle>
          <SheetDescription>
            Select how users can enter the giveaway, here are some options:
          </SheetDescription>
        </SheetHeader>
        <br />
        <div className="space-y-2">
          {widetype.keys(TASK_GROUP).map((t) => (
            <SelectTask
              key={t}
              type={t}
              onClick={() => {
                setOpen(false);
                onSelect(t);
              }}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const SelectTask: React.FC<{ type: TaskType; onClick: () => void }> = ({
  type,
  onClick
}) => {
  const theme = toTheme(type);
  return (
    <div
      className="flex items-center justify-between gap-2 cursor-pointer border-1 rounded-lg p-2 hover:bg-primary/90 bg-primary text-primary-foreground"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex items-center justify-center w-6 h-6 p-0.5 rounded-md border',
            theme.symbol
          )}
        >
          <theme.icon />
        </div>
        <Typography.Paragraph size="sm" weight="medium">
          {theme.label}
        </Typography.Paragraph>
      </div>
      <Badge variant="secondary" className="pl-1 pr-1">
        <ChevronRight strokeWidth={2.5} />
      </Badge>
    </div>
  );
};
