'use client';

import { TablePagination } from '@/components/ui/table-pagination';
import { useCallback, useState } from 'react';
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
  SweepstakesDataSchema
} from '@/schemas/sweepstakes';

import { CreateGiveawayButton } from '@/components/sweepstakes/create-giveaway-button';
import { SweepstakesStatus } from '@prisma/client';
import { DeleteConfirmationModal } from '@/components/sweepstakes/delete-confirmation-modal';
import { useSweepstakesPage } from '@/components/sweepstakes/use-sweepstakes-page';
import { useEditSweepstakesPage } from '@/components/sweepstakes/use-edit-sweepstakes-page';
import { DEFAULT_PAGE_SIZE } from '@/lib/settings';
import { useSweepstakesDetailsPage } from '@/components/sweepstakes/use-sweepstakes-details-page';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/schemas/giveaway/defaults';

interface SweepstakesTableProps {
  sweepstakes: SweepstakesDataSchema[];
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

  const [deleteModal, setDeleteModal] = useState<SweepstakesDataSchema | null>(
    null
  );

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

  // TODO: move out of component
  const getStatusIcon = (status: SweepstakesDataSchema['status']) => {
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

  const handleRowClick = (item: SweepstakesDataSchema) => () => {
    if (item.status === SweepstakesStatus.DRAFT) {
      editPage.navigateTo(item.id);
    } else {
      detailsPage.navigateTo(item.id);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Card className="overflow-hidden p-0 gap-0">
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
                <TableRow
                  key={item.id}
                  className="hover:bg-muted/50 h-12 group cursor-pointer"
                  onClick={handleRowClick(item)}
                >
                  <TableCell className="py-2 w-[300px]">
                    <div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <div className="font-medium group-hover:text-primary group-hover:underline line-clamp-1">
                          {item.name || DEFAULT_SWEEPSTAKES_NAME}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {item.status !== SweepstakesStatus.DRAFT && (
                            <DropdownMenuItem asChild>
                              <Link href={detailsPage.route(item.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={editPage.route(item.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              return setDeleteModal(item);
                            }}
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
          <TablePagination
            totalItems={sweepstakes.length}
            currentPage={filters.page ?? 1}
            totalPages={Math.ceil(sweepstakes.length / DEFAULT_PAGE_SIZE)}
            pageSize={DEFAULT_PAGE_SIZE}
            onPageChange={(value) =>
              basePage.updateParams((params) =>
                params.set('page', value.toString())
              )
            }
            itemName="sweepstakes"
          />
        </Card>
      </div>

      <DeleteConfirmationModal
        onClose={handleDeleteModalClose}
        sweepstakes={deleteModal}
      />
    </div>
  );
}
