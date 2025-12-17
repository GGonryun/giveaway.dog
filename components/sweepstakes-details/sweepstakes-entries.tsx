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
import { Globe } from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';
import { formatDistanceToNowStrict } from 'date-fns';
import { UserSchema } from '@/schemas/user';
import { Button } from '../ui/button';
import { DEFAULT_PAGE_SIZE } from '@/lib/settings';
import { TASK_LABEL, UserEntriesSchema } from '@/lib/task/schemas';
import { TaskStatusBadge } from '@/lib/task/components/task-status-badge';
import { UserSourceBadge } from '@/lib/user-source/components/user-source-badge';
import { UserSourceCaption } from '@/lib/user-source/components/user-source-caption';

interface SweepstakesEntriesProps {
  slug: string;
  sweepstakesId: string;
  entries: UserEntriesSchema[];
}

export const SweepstakesEntries = ({
  slug,
  sweepstakesId,
  entries
}: SweepstakesEntriesProps) => {
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 25;
  const totalEntries = entries.length;
  const totalPages = Math.ceil(totalEntries / pageSize);

  const paginatedEntries = entries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTaskClick = (taskCompletion: UserEntriesSchema) => {
    router.push(
      `/app/${slug}/sweepstakes/${sweepstakesId}/entries/task/${taskCompletion.task.id}?active=${taskCompletion.id}`
    );
  };

  const handleUserClick = (user: UserSchema) => {
    router.push(
      `/app/${slug}/sweepstakes/${sweepstakesId}/entries/user/${user.id}`
    );
  };

  return (
    <>
      <Card className="overflow-hidden p-0 gap-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Participant</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEntries.map((completion) => (
              <TableRow
                key={completion.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleTaskClick(completion)}
              >
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <TaskStatusBadge status={completion.status} />
                  </div>
                </TableCell>

                <TableCell>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="link"
                        className="p-0 m-0 h-6 font-medium hover:text-primary transition-colors cursor-pointer"
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
                    <div className="flex items-center gap-1">
                      <UserSourceBadge source={completion.user.source} />
                      <Button
                        variant="link"
                        className="p-0 m-0 h-6 font-medium hover:text-primary transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserClick(completion.user);
                        }}
                      >
                        {completion.user.name}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <UserSourceCaption user={completion.user} />
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {completion.user.countryCode}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNowStrict(completion.completedAt, {
                      addSuffix: true
                    })}
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
