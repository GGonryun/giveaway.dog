'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, CheckCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGiveawayParticipation } from '../giveaway-participation-context';
import { getTaskTheme } from '@/components/tasks/theme';

// Task completion component
const TaskItem: React.FC<{
  task: any;
  taskId: string;
  completed: boolean;
}> = ({ task, taskId, completed }) => {
  const { onTaskComplete, user } = useGiveawayParticipation();
  const theme = getTaskTheme(task.type);
  const IconComponent = theme.icon;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 border rounded-lg transition-colors',
        completed ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50',
        !user?.profile && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full',
            completed ? 'bg-green-100 text-green-600' : theme.symbol
          )}
        >
          {completed ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <IconComponent className="h-4 w-4" />
          )}
        </div>
        <div>
          <h4 className="font-medium text-sm">{task.title}</h4>
          <p className="text-xs text-muted-foreground">
            {task.value} {task.value === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {task.mandatory && (
          <Badge variant="destructive" className="text-xs">
            Required
          </Badge>
        )}
        {!completed && user?.profile && (
          <Button size="sm" onClick={() => onTaskComplete?.(taskId)}>
            Complete
          </Button>
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
    </div>
  );
};

export const ActiveParticipation: React.FC = () => {
  const { giveaway, user } = useGiveawayParticipation();

  const userProgress = useMemo(() => {
    if (!user?.participation)
      return { completed: 0, total: giveaway.tasks.length, percentage: 0 };

    const completed = giveaway.tasks.filter((_, index) =>
      user.participation.completedTasks.includes(`task-${index}`)
    ).length;
    const total = giveaway.tasks.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage };
  }, [user?.participation, giveaway.tasks]);

  const hasTasks = giveaway.tasks && giveaway.tasks.length > 0;
  const hasPrizes = giveaway.prizes && giveaway.prizes.length > 0;
  const hasContent = hasTasks || hasPrizes;

  return (
    <div className="space-y-6">
      {hasContent ? (
        <Card>
          <CardHeader>
            {user?.profile && hasTasks && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">Progress</div>
                  <Badge variant="outline">
                    {userProgress.completed}/{userProgress.total} completed
                  </Badge>
                </div>
                <Progress value={userProgress.percentage} className="w-full" />
              </>
            )}
          </CardHeader>

          <CardContent>
            <Tabs
              defaultValue={hasTasks ? 'tasks' : 'prizes'}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tasks">
                  Entry Methods {hasTasks && `(${giveaway.tasks.length})`}
                </TabsTrigger>
                <TabsTrigger value="prizes">
                  Prizes {hasPrizes && `(${giveaway.prizes.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tasks" className="mt-4">
                {hasTasks ? (
                  <div className="space-y-3">
                    {giveaway.tasks.map((task, index) => {
                      const taskId = `task-${index}`;
                      const completed =
                        user?.participation?.completedTasks.includes(taskId) ??
                        false;

                      return (
                        <TaskItem
                          key={index}
                          task={task}
                          taskId={taskId}
                          completed={completed}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Plus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">
                      No Entry Methods
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Add entry methods in the Tasks step to see them here.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="prizes" className="mt-4">
                {hasPrizes ? (
                  <div className="space-y-3">
                    {giveaway.prizes.map((prize, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg transition-colors text-left"
                      >
                        <div>
                          <h4 className="font-medium">{prize.name}</h4>
                        </div>
                        <Badge variant="secondary">
                          {prize.winners}{' '}
                          {prize.winners === 1 ? 'winner' : 'winners'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Gift className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">
                      No prizes available
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Add prizes in the Prizes step to see them here.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
                <Gift className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-600 mb-2">
                No Content Yet
              </h4>
              <p className="text-sm text-muted-foreground">
                Add entry methods and prizes to see your giveaway content.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
