'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { formatDistanceToNowStrict } from 'date-fns';
import { DEFAULT_PAGE_SIZE } from '@/lib/settings';

import { Button } from '@/components/ui/button';

import { TASK_LABEL } from '@/lib/task/schemas';
import { TaskStatusBadge } from '@/lib/task/components/task-status-badge';
import { TaskStatusIcon } from '@/lib/task/components/task-status-icon';
import { TaskCompletionSchema } from '@/lib/task/completions';

interface UserEntriesProps {
  slug: string;
  entries: TaskCompletionSchema[];
}

export const UserEntries = ({ slug, entries }: UserEntriesProps) => {
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = DEFAULT_PAGE_SIZE;
  const totalEntries = entries.length;
  const totalPages = Math.ceil(totalEntries / pageSize);

  const paginatedEntries = entries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTaskClick = (taskCompletion: TaskCompletionSchema) => {
    router.push(
      `/app/${slug}/sweepstakes/${taskCompletion.sweepstake.id}/entries/task/${taskCompletion.task.id}?active=${taskCompletion.id}`
    );
  };

  const handleSweepstakeClick = (taskCompletion: TaskCompletionSchema) => {
    router.push(
      `/app/${slug}/sweepstakes/${taskCompletion.sweepstake.id}/preview`
    );
  };

  return (
    <>
      <Card className="overflow-hidden p-0 gap-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Sweepstake</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEntries.map((completion) => (
              <TableRow key={completion.id}>
                <TableCell>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="link"
                        className="p-0 m-0 h-6 font-medium hover:text-primary transition-colors cursor-pointer"
                        onClick={() => handleTaskClick(completion)}
                      >
                        {completion.task.title}
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-muted-foreground">
                        {TASK_LABEL[completion.task.type]}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="link"
                        className="p-0 m-0 h-6 font-medium hover:text-primary transition-colors cursor-pointer"
                        onClick={() => handleSweepstakeClick(completion)}
                      >
                        {completion.sweepstake.name}
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-muted-foreground">
                        ID: {completion.sweepstake.id}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-2">
                    <TaskStatusIcon status={completion.status} />
                    <TaskStatusBadge status={completion.status} />
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNowStrict(
                      completion.completedAt ?? Date.now(),
                      {
                        addSuffix: true
                      }
                    )}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          totalItems={totalEntries}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          itemName="task completions"
          isPending={false}
        />
      </Card>
    </>
  );
};
