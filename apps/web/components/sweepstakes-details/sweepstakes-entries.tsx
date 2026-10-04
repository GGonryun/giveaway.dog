'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@giveaway/ui-primitives/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@giveaway/ui-primitives/table';
import { Globe, MoreVertical, CheckCircle, Trash2 } from 'lucide-react';
import { TablePagination } from '@giveaway/ui-primitives/table-pagination';
import { formatDistanceToNowStrict } from 'date-fns';
import { UserSchema } from '@giveaway/user-model/user';
import { Button } from '@giveaway/ui-primitives/button';

import { TASK_LABEL, UserEntriesSchema } from '@/lib/task/schemas';
import { TaskStatusBadge } from '@/lib/task/components/task-status-badge';
import { UserSourceBadge } from '@/lib/user-source/components/user-source-badge';
import { UserSourceCaption } from '@/lib/user-source/components/user-source-caption';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@giveaway/ui-primitives/dropdown-menu';
import { VerificationInstructionsDialog } from './verification-instructions-dialog';
import { DeleteEntryDialog } from './delete-entry-dialog';

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
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompletion, setSelectedCompletion] =
    useState<UserEntriesSchema | null>(null);

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

  const handleVerifyClick = (
    e: React.MouseEvent,
    completion: UserEntriesSchema
  ) => {
    e.stopPropagation();
    setSelectedCompletion(completion);
    setVerifyDialogOpen(true);
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    completion: UserEntriesSchema
  ) => {
    e.stopPropagation();
    setSelectedCompletion(completion);
    setDeleteDialogOpen(true);
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
              <TableHead className="w-12"></TableHead>
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

                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => handleVerifyClick(e, completion)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Entry
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteClick(e, completion)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Entry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      {selectedCompletion && (
        <>
          <VerificationInstructionsDialog
            open={verifyDialogOpen}
            onOpenChange={setVerifyDialogOpen}
            taskCompletionId={selectedCompletion.id}
            sweepstakesId={sweepstakesId}
            task={selectedCompletion.task}
            user={selectedCompletion.user}
            currentStatus={selectedCompletion.status}
          />
          <DeleteEntryDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            completion={selectedCompletion}
            sweepstakesId={sweepstakesId}
            onDeleted={() => router.refresh()}
          />
        </>
      )}
    </>
  );
};
