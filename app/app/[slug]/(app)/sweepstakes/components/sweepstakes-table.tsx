'use client';

import { SweepstakesPagination } from './sweepstakes-pagination';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  Edit,
  Copy,
  Pause,
  Play,
  Trash2,
  MoreHorizontal,
  Calendar,
  Users,
  Target,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import Link from 'next/link';
import {
  ListSweepstakesFilters,
  SortDirection,
  SortField,
  SweepstakesData
} from '@/schemas/sweepstakes';

import { CreateGiveawayButton } from '@/components/sweepstakes/create-giveaway-button';
import { SweepstakesStatus } from '@prisma/client';
import { DeleteConfirmationModal } from '@/components/sweepstakes/delete-confirmation-modal';
import { useSweepstakesPage } from '@/components/sweepstakes/use-sweepstakes-page';
import { useEditSweepstakesPage } from '@/components/sweepstakes/use-edit-sweepstakes-page';
import { useSweepstakesDetailsPage } from '@/components/sweepstakes/use-sweepstakes-details-page';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/schemas/giveaway/defaults';

interface SweepstakesTableProps {
  sweepstakes: SweepstakesData[];
  filters: ListSweepstakesFilters;
}

const SortableHeader: React.FC<{
  field: SortField;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
  className?: string;
  sortField?: SortField;
  sortDirection?: SortDirection;
}> = ({
  field,
  onSort,
  sortField,
  sortDirection,
  children,
  className = ''
}) => {
  const getSortIcon = () => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4" />;
    if (sortDirection === 'desc') return <ArrowDown className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  return (
    <TableHead
      className={`cursor-pointer hover:bg-muted/50 select-none py-2 ${className}`}
      onClick={() => onSort(field)}
    >
      <div
        className={`flex items-center space-x-2 ${className.includes('text-right') ? 'justify-end' : ''}`}
      >
        <span>{children}</span>
        {getSortIcon()}
      </div>
    </TableHead>
  );
};

export function SweepstakesTable({
  sweepstakes,
  filters
}: SweepstakesTableProps) {
  const basePage = useSweepstakesPage();
  const editPage = useEditSweepstakesPage();
  const detailsPage = useSweepstakesDetailsPage();

  const [deleteModal, setDeleteModal] = useState<SweepstakesData | null>(null);

  // Handle column sorting
  const handleSort = (field: SortField) => {
    let newDirection: SortDirection | undefined = 'asc';

    if (filters.sortField === field) {
      if (filters.sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (filters.sortDirection === 'desc') {
        newDirection = undefined;
      } else {
        newDirection = 'asc';
      }
    }
    basePage.updateParams((params) => {
      if (newDirection) {
        params.set('sortField', field);
        params.set('sortDirection', newDirection);
      } else {
        params.delete('sortField');
        params.delete('sortDirection');
      }
      params.set('page', '1'); // Reset to first page when sorting changes
    });
  };

  const handleDeleteModalClose = () => {
    setDeleteModal(null);
  };

  const getStatusBadge = (status: SweepstakesData['status']) => {
    const variants = {
      ACTIVE: {
        variant: 'default' as const,
        label: 'Active',
        color: 'text-green-600'
      },
      CANCELED: {
        variant: 'destructive' as const,
        label: 'Ending Soon',
        color: 'text-red-600'
      },
      DRAFT: {
        variant: 'secondary' as const,
        label: 'Draft',
        color: 'text-gray-600'
      },
      PAUSED: {
        variant: 'outline' as const,
        label: 'Paused',
        color: 'text-yellow-600'
      },
      COMPLETED: {
        variant: 'secondary' as const,
        label: 'Completed',
        color: 'text-blue-600'
      }
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: SweepstakesData['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'PAUSED':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'CANCELED':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'DRAFT':
        return <Edit className="h-4 w-4 text-gray-500" />;
      case 'COMPLETED':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          <div className="space-y-3">
            {sweepstakes.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {getStatusIcon(item.status)}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/app/sweepstakes/${item.id}`}
                          className="font-medium hover:text-primary hover:underline block truncate"
                        >
                          {item.name || DEFAULT_SWEEPSTAKES_NAME}
                        </Link>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Entries
                      </div>
                      <div className="font-medium">
                        {item.entries.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Performance
                      </div>
                      <div className="space-y-1">
                        <div
                          className={`text-xs font-medium ${
                            item.conversionRate > 8
                              ? 'text-green-600'
                              : item.conversionRate > 5
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          Conv: {item.conversionRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.timeLeft}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/sweepstakes/${item.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/app/sweepstakes/${item.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {item.status === SweepstakesStatus.ACTIVE ? (
                            <DropdownMenuItem className="text-yellow-600">
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          ) : item.status === SweepstakesStatus.PAUSED ? (
                            <DropdownMenuItem className="text-green-600">
                              <Play className="h-4 w-4 mr-2" />
                              Resume
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteModal(item)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader
                  field="name"
                  className="w-[300px]"
                  onSort={handleSort}
                  sortField={filters.sortField}
                  sortDirection={filters.sortDirection}
                >
                  Sweepstakes
                </SortableHeader>
                <TableHead className="text-right w-24">Entries</TableHead>
                <TableHead className="text-right w-24">Conversion</TableHead>
                <TableHead className="text-right py-2 w-28">
                  Time Left
                </TableHead>
                <TableHead className="text-right py-2 w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sweepstakes.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50 h-12">
                  <TableCell className="py-2 w-[300px]">
                    <div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <div>
                          <Link
                            href={detailsPage.route(item.id)}
                            className="font-medium hover:text-primary hover:underline line-clamp-1"
                          >
                            {item.name || DEFAULT_SWEEPSTAKES_NAME}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-2 w-24">
                    <div>
                      <div className="font-medium flex items-center justify-end space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{item.entries.toLocaleString()}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-2 w-24">
                    <div className="flex items-center justify-end space-x-1">
                      <Target className="h-3 w-3" />
                      <span
                        className={`font-medium ${
                          item.conversionRate > 8
                            ? 'text-green-600'
                            : item.conversionRate > 5
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {item.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-right w-28">
                    <div className="flex items-center justify-end space-x-1 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{item.timeLeft}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-2 w-24">
                    <div className="flex items-center justify-end space-x-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={detailsPage.route(item.id)}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={detailsPage.route(item.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={editPage.route(item.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteModal(item)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Empty State */}
        {sweepstakes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
            <Calendar className="h-8 w-8  opacity-50" />
            <p>No sweepstakes found</p>
            <CreateGiveawayButton
              showDropdown={false}
              text="Create Your First Giveaway"
              variant="default"
            />
          </div>
        )}
        <SweepstakesPagination
          totalResults={sweepstakes.length}
          currentPage={filters.page ?? 1}
          totalPages={Math.ceil(sweepstakes.length / (filters.size ?? 10))}
          onPageChange={(value) =>
            basePage.updateParams((params) =>
              params.set('page', value.toString())
            )
          }
          pageSize={filters.size ?? 10}
          onPageSizeChange={(size) => {
            basePage.updateParams((params) => {
              params.set('size', size.toString());
              params.set('page', '1'); // Reset to first page when page size changes
            });
          }}
        />
      </div>

      <DeleteConfirmationModal
        onClose={handleDeleteModalClose}
        sweepstakes={deleteModal}
      />
    </div>
  );
}
