import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React from 'react';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { widetype } from '@/lib/widetype';
import { PlusIcon, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import {
  TASK_LABEL,
  TASK_IS_IMPORT,
  TASK_ALLOW_MANUAL_ADD,
  TASK_DUPLICATE_RESTRICTION,
  TaskType
} from '../../schemas';
import { toTaskTheme } from '../theme';
import { EntryMethodBadge } from '../entry-methods/entry-method-badge';

export const SelectTaskDialog: React.FC<{
  onSelect: (type: TaskType) => void;
  existingTasks: TaskType[];
}> = ({ onSelect, existingTasks }) => {
  const [open, setOpen] = React.useState(false);

  const allTaskTypes = widetype.keys(TASK_LABEL);
  const regularTasks = allTaskTypes.filter(
    (t) => !TASK_IS_IMPORT[t] && TASK_ALLOW_MANUAL_ADD[t]
  );
  const importTasks = allTaskTypes.filter((t) => TASK_IS_IMPORT[t]);

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
      <SheetContent side="left" className="w-full sm:w-150 flex flex-col">
        <SheetHeader className="text-left pb-0 hidden">
          <SheetTitle>Entry Methods</SheetTitle>
          <SheetDescription>
            Select how users can enter the giveaway:
          </SheetDescription>
        </SheetHeader>
        <Tabs
          defaultValue="regular"
          className="flex-1 overflow-hidden flex flex-col mt-2 gap-2"
        >
          <TabsList className="mx-2 sm:mx-4">
            <TabsTrigger value="regular">
              Entry Methods ({regularTasks.length})
            </TabsTrigger>
            <TabsTrigger value="import">
              Import Tasks ({importTasks.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="regular"
            className="space-y-2 pb-8 px-2 sm:px-4 overflow-auto"
          >
            {regularTasks.map((t) => (
              <SelectTask
                key={t}
                type={t}
                existingTasks={existingTasks}
                onClick={() => {
                  setOpen(false);
                  onSelect(t);
                }}
              />
            ))}
          </TabsContent>
          <TabsContent
            value="import"
            className="space-y-2 pb-8 px-2 sm:px-4 overflow-auto"
          >
            {importTasks.length > 0 ? (
              importTasks.map((t) => (
                <SelectTask
                  key={t}
                  type={t}
                  existingTasks={existingTasks}
                  onClick={() => {
                    setOpen(false);
                    onSelect(t);
                  }}
                />
              ))
            ) : (
              <div className="flex items-center justify-center py-8">
                <Typography.Paragraph className="text-muted-foreground">
                  No import tasks available
                </Typography.Paragraph>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

const SelectTask: React.FC<{
  type: TaskType;
  onClick: () => void;
  existingTasks: TaskType[];
}> = ({ type, onClick, existingTasks }) => {
  const theme = toTaskTheme(type);
  const isRestricted = TASK_DUPLICATE_RESTRICTION[type];
  const alreadyExists = existingTasks.includes(type);
  const isDisabled = isRestricted && alreadyExists;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 border rounded-lg p-2',
        isDisabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:bg-accent hover:border-accent/50'
      )}
      onClick={isDisabled ? undefined : onClick}
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
        <div className="flex items-center gap-2">
          <Typography.Paragraph size="md" weight="medium">
            {TASK_LABEL[type]}
          </Typography.Paragraph>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <EntryMethodBadge
          type={type}
          showMaxOfOne={isRestricted && alreadyExists}
        />
        <Badge variant="secondary" className="p-1 mr-1">
          <ChevronRight strokeWidth={2.5} />
        </Badge>
      </div>
    </div>
  );
};
