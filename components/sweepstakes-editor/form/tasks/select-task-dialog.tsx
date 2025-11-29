import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import React from 'react';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { widetype } from '@/lib/widetype';
import { PlusIcon, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toTaskTheme } from '@/lib/task/components/theme';
import { TASK_LABEL } from '@/lib/task/schemas';
import { TaskType } from '@prisma/client';

export const SelectTaskDialog: React.FC<{
  onSelect: (type: TaskType) => void;
}> = ({ onSelect }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          type="button"
          className="w-full shadow-sm cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <PlusIcon />
          Add Entry Method
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-[600px]">
        <SheetHeader className="text-left">
          <SheetTitle>Entry Methods</SheetTitle>
          <SheetDescription>
            Select how users can enter the giveaway:
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-2 px-2 sm:px-4">
          {widetype.keys(TASK_LABEL).map((t) => (
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
  const theme = toTaskTheme(type);
  return (
    <div
      className="flex items-center justify-between gap-2 cursor-pointer border rounded-lg p-2 hover:bg-accent hover:border-accent/50"
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
        <Typography.Paragraph size="md" weight="medium">
          {TASK_LABEL[type]}
        </Typography.Paragraph>
      </div>
      <Badge variant="secondary" className="px-0.5 mr-1">
        <ChevronRight strokeWidth={2.5} />
      </Badge>
    </div>
  );
};
