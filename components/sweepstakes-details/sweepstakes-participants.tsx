'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, UserX, CheckCircle, Users } from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';
import { StatusExplanationDialog } from '../users/status-explanation-dialog';

import { DEFAULT_PAGE_SIZE } from '@/lib/settings';
import { datetime } from '@/lib/date';
import { SweepstakesParticipantSchema } from '@/schemas/giveaway/participant';

export const SweepstakesParticipants: React.FC<{
  slug: string;
  sweepstakesId: string;
  users: SweepstakesParticipantSchema[];
}> = ({ users, slug, sweepstakesId }) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusDialogUser, setStatusDialogUser] =
    useState<SweepstakesParticipantSchema | null>(null);

  const pageSize = DEFAULT_PAGE_SIZE;
  const totalUsers = users.length;
  const totalPages = Math.ceil(totalUsers / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  const getStatusBadge = (
    status: string,
    user: SweepstakesParticipantSchema
  ) => {
    const variants = {
      active: {
        variant: 'default' as const,
        label: 'Active',
        icon: CheckCircle,
        className: 'bg-blue-500 hover:bg-blue-600 text-white'
      },
      blocked: {
        variant: 'secondary' as const,
        label: 'Blocked',
        icon: UserX,
        className: ''
      }
    };

    const config = variants[status as keyof typeof variants] || variants.active;
    const IconComponent = config.icon;

    return (
      <Badge
        variant={config.variant}
        className={`text-xs cursor-pointer hover:opacity-80 transition-opacity ${config.className}`}
        onClick={(e) => {
          e.stopPropagation();
          setStatusDialogUser(user);
          setShowStatusDialog(true);
        }}
      >
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Calculate shown entries for pagination
  const startEntry = (currentPage - 1) * DEFAULT_PAGE_SIZE + 1;
  const endEntry = Math.min(currentPage * DEFAULT_PAGE_SIZE, totalUsers);
  const paginatedUsers = users.slice(startEntry - 1, endEntry);

  return (
    <div>
      <div className="w-full space-y-4">
        <div>
          <Card className="p-0 overflow-hidden">
            <CardHeader hidden>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span className="text-lg font-semibold">Participants</span>
                  <Badge variant="secondary">
                    {totalUsers.toLocaleString()} total
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Users participating in this specific sweepstakes.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Last Entry</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Engagement
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        Status
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className={'cursor-pointer hover:bg-muted/50'}
                        onClick={() => {
                          router.push(
                            `/app/${slug}/sweepstakes/${sweepstakesId}/participants/${user.id}`
                          );
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="font-medium text-sm">
                                {user.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user.email}
                              </div>
                              <div className="mt-1">
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0"
                                >
                                  {user.country}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {datetime.format(user.lastEntryAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  user.qualityScore >= 80
                                    ? 'bg-green-500'
                                    : user.qualityScore >= 60
                                      ? 'bg-yellow-500'
                                      : user.qualityScore >= 40
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                }`}
                                style={{ width: `${user.qualityScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium min-w-[2rem]">
                              {user.qualityScore}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  user.engagement >= 80
                                    ? 'bg-green-500'
                                    : user.engagement >= 60
                                      ? 'bg-blue-500'
                                      : user.engagement >= 40
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                }`}
                                style={{ width: `${user.engagement}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium min-w-[2.5rem]">
                              {user.engagement}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {getStatusBadge(user.status, user)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              side="bottom"
                              sideOffset={4}
                              avoidCollisions={true}
                            >
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/app/${slug}/users/${user.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Full Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/app/${slug}/sweepstakes/${sweepstakesId}/participants/${user.id}`
                                  );
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Quick View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  alert('Block user action');
                                }}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Block User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                totalItems={totalUsers}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={handlePageChange}
                itemName="participants"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Explanation Dialog */}
      <StatusExplanationDialog
        open={showStatusDialog}
        onClose={() => {
          setShowStatusDialog(false);
          setStatusDialogUser(null);
        }}
        status={statusDialogUser?.status || 'active'}
      />
    </div>
  );
};
