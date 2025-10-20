'use client';

import { TablePagination } from '@/components/ui/table-pagination';
import { useState } from 'react';
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
  Trash2,
  MoreHorizontal,
  Calendar,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileCheck
} from 'lucide-react';
import Link from 'next/link';
import {
  ListSweepstakesFilters,
  ListSweepstakesDataSchema,
  SortDirection,
  SortField,
  SweepstakesDataSchema,
  EDITABLE_DERIVED_STATUS
} from '@/schemas/sweepstakes';

import { CreateGiveawayButton } from '@/components/sweepstakes/create-giveaway-button';
import { DeleteConfirmationModal } from '@/components/sweepstakes/delete-confirmation-modal';
import { useSweepstakesPage } from '@/components/sweepstakes/use-sweepstakes-page';
import { useEditSweepstakesPage } from '@/components/sweepstakes/use-edit-sweepstakes-page';
import { DEFAULT_PAGE_SIZE } from '@/lib/settings';
import { useSweepstakesDetailsPage } from '@/components/sweepstakes/use-sweepstakes-details-page';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/schemas/giveaway/defaults';
import { Badge } from '@/components/ui/badge';
import { DerivedStatusIcon } from '@/lib/sweepstake-status';

interface SweepstakesTableProps {
  data: ListSweepstakesDataSchema;
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

export function SweepstakesTable({ data, filters }: SweepstakesTableProps) {
  const { sweepstakes, totalCount, currentPage, totalPages } = data;
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

  const handleRowClick = (item: SweepstakesDataSchema) => () => {
    if (item.status === 'DRAFT') {
      editPage.navigateTo(item.id);
    } else {
      detailsPage.navigateTo(item.id);
    }
  };

  return (
    <div className="space-y-4">
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
              <TableHead className="text-right w-24">Users</TableHead>
              <TableHead className="text-right w-32">Time Left</TableHead>
              <TableHead className="text-right w-28">Status</TableHead>
              <TableHead className="text-right w-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sweepstakes.map((item) => {
              const isEditable = EDITABLE_DERIVED_STATUS[item.status];
              return (
                <TableRow
                  key={item.id}
                  className="group hover:bg-muted/50 h-12  cursor-pointer"
                  onClick={handleRowClick(item)}
                >
                  <TableCell className="py-2 min-w-[256px]">
                    <div>
                      <div className="flex items-center space-x-2">
                        <DerivedStatusIcon status={item.status} size={4} />
                        <div className="font-medium group-hover:text-primary group-hover:underline line-clamp-1">
                          {item.name || DEFAULT_SWEEPSTAKES_NAME}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right w-24">
                    <div className="flex items-center justify-end space-x-1 text-sm">
                      <FileCheck className="h-3 w-3" />
                      <span>{item.entries}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right w-24">
                    <div className="flex items-center justify-end space-x-1 text-sm">
                      <Users className="h-3 w-3" />
                      <span>{item.participants}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right w-32">
                    <span>{item.timeLeft}</span>
                  </TableCell>
                  <TableCell className="text-right w-28">
                    <Badge variant="outline" className="gap-1.5">
                      <DerivedStatusIcon status={item.status} size={3} />
                      <span className="capitalize">
                        {item.status.toLowerCase()}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right w-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {item.status !== 'DRAFT' && (
                          <DropdownMenuItem asChild>
                            <Link href={detailsPage.route(item.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {isEditable && (
                          <DropdownMenuItem asChild>
                            <Link href={editPage.route(item.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        )}
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {/* Empty State */}
        {sweepstakes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
            <Calendar className="h-8 w-8 opacity-50" />
            <p>No sweepstakes found</p>
            <CreateGiveawayButton
              showDropdown={false}
              text="Create Your First Giveaway"
            />
          </div>
        )}
        <TablePagination
          totalItems={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={(value) =>
            basePage.updateParams((params) =>
              params.set('page', value.toString())
            )
          }
          itemName="sweepstakes"
        />
      </Card>

      <DeleteConfirmationModal
        onClose={handleDeleteModalClose}
        sweepstakes={deleteModal}
      />
    </div>
  );
}
