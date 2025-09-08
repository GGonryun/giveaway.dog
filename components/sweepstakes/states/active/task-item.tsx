import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGiveawayParticipation } from '../../giveaway-participation-context';
import { toTaskTheme } from '@/components/tasks/theme';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import pluralize from 'pluralize';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

export const TaskItem: React.FC<{
  open: boolean;
  setOpen: (open: boolean) => void;
  task: any;
  taskId: string;
  completed: boolean;
}> = ({ open, setOpen, task, completed }) => {
  const { userProfile } = useGiveawayParticipation();
  const theme = toTaskTheme(task.type);
  const IconComponent = theme.icon;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        'border rounded-lg transition-colors bg-sidebar overflow-hidden',
        !userProfile && 'opacity-75'
      )}
    >
      <CollapsibleTrigger
        className={cn(
          'group flex items-stretch justify-between w-full',
          completed
            ? 'bg-green-50 border-green-200'
            : 'hover:bg-accent/80 hover:text-success'
        )}
      >
        <div className="flex items-center gap-2 flex-1">
          <div
            className={cn(
              'flex items-center justify-center min-w-8 w-12 h-full group-hover:opacity-50',
              completed ? 'bg-green-100 text-green-600' : theme.symbol
            )}
          >
            {completed ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <IconComponent className="h-6 w-6" />
            )}
          </div>
          <div>
            <h4 className="text-left font-medium text-base sm:text-lg">
              {task.title}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2">
          {task.mandatory && (
            <Badge variant="destructive" className="text-xs">
              Required
            </Badge>
          )}
          {!completed && userProfile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" className=" sm:px-6">
                  +{task.value}
                </Button>
              </TooltipTrigger>

              <TooltipContent side="left" align="center">
                <p>
                  This task will earn you {task.value}{' '}
                  {pluralize('entry', task.value)}.
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          {completed && (
            <Badge
              variant="secondary"
              className="text-xs bg-green-100 text-green-700"
            >
              ✓ Done
            </Badge>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t bg-background p-2 ">
        Yes. Free to use for personal and commercial projects. No attribution
        required.
      </CollapsibleContent>
    </Collapsible>
  );
};
