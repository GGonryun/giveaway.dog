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
import { Eye, Edit, Trash2, MoreHorizontal, Calendar } from 'lucide-react';
import Link from 'next/link';

import { DEFAULT_PAGE_SIZE } from '@/lib/settings';
import { PickersV2ListItemSchema, PickersV2ListSchema } from '../schemas/list';
import { usePickersV2Navigation } from '../hooks/use-pickers-v2-navigation';
import { CreatePickerV2Button } from './create-picker-v2-button';
import { EDITABLE_PICKER_STATUS } from '@/lib/pickers/shared/schemas/status';
import { PickerStatusBadge } from '@/lib/pickers/shared/components/picker-status-badge';
import { datetime } from '@/lib/date';
import { PickerTypeLogo } from '@/lib/pickers/shared/components/picker-type-logo';
import { DeletePickerV2Modal } from './delete-picker-v2-modal';

interface PickersV2TableProps {
  data: PickersV2ListSchema;
}

export function PickersV2Table({ data }: PickersV2TableProps) {
  const { pickers } = data;
  const router = usePickersV2Navigation();

  const totalCount = pickers.length;
  const currentPage = 1;
  const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE);

  const [deleteModal, setDeleteModal] =
    useState<PickersV2ListItemSchema | null>(null);

  const handleDeleteModalClose = () => {
    setDeleteModal(null);
  };

  const handleRowClick = (item: PickersV2ListItemSchema) => () => {
    if (item.status === 'DRAFT') {
      router.navigateToEdit(item.pickerId);
    } else {
      router.navigateToDetails(item.pickerId);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0 gap-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Picker</TableHead>
              <TableHead className="text-right  w-46">Last Updated</TableHead>
              <TableHead className="text-right w-28">Status</TableHead>
              <TableHead className="text-right w-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pickers.map((item) => {
              const isEditable = EDITABLE_PICKER_STATUS[item.status];
              return (
                <TableRow
                  key={item.pickerId}
                  className="group hover:bg-muted/50 h-12  cursor-pointer"
                  onClick={handleRowClick(item)}
                >
                  <TableCell className="py-2 min-w-[256px]">
                    <div>
                      <div className="flex items-center space-x-2">
                        <PickerTypeLogo type={item.type} />
                        <div className="font-medium group-hover:text-primary group-hover:underline line-clamp-1">
                          {item.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-right w-46">
                    <code className="text-xs font-code bg-muted block">
                      {datetime.format(item.updatedAt, 'short')}
                    </code>
                  </TableCell>
                  <TableCell className="text-right w-28">
                    <PickerStatusBadge status={item.status} />
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
                            <Link href={router.detailsRoute(item.pickerId)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {isEditable && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.navigateToEdit(item.pickerId);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
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
        {pickers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
            <Calendar className="h-8 w-8 opacity-50" />
            <p>No pickers found</p>
            <CreatePickerV2Button text="Create Your First Picker" />
          </div>
        )}
        <TablePagination
          totalItems={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={(value) =>
            router.updateParams((params) =>
              params.set('page', value.toString())
            )
          }
          itemName="pickers"
        />
      </Card>

      <DeletePickerV2Modal
        onClose={handleDeleteModalClose}
        picker={deleteModal}
      />
    </div>
  );
}
