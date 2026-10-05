import { Card, CardContent, CardHeader } from '@giveaway/ui-primitives/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@giveaway/ui-primitives/table';
import { Skeleton } from '@giveaway/ui-primitives/skeleton';
import { Badge } from '@giveaway/ui-primitives/badge';
import { Users } from 'lucide-react';

export const UsersTableSkeleton = () => {
  return (
    <div>
      <div className="w-full space-y-4">
        <div className="flex items-start gap-2">
          <div className="flex-grow flex gap-2">
            <div className="relative flex-grow">
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-[100px]" />
          </div>
          <div className="flex-shrink-0">
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>
        <div>
          <Card className="p-0 overflow-hidden">
            <CardHeader hidden>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span className="text-lg font-semibold">Users</span>
                  <Badge variant="secondary">
                    <Skeleton className="h-4 w-12" />
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden lg:table-cell text-right">
                        Quality
                      </TableHead>
                      <TableHead className="hidden xl:table-cell text-right">
                        Engagement
                      </TableHead>
                      <TableHead className="hidden sm:table-cell text-right">
                        Last Entry
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 10 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-[200px]" />
                              <Skeleton className="h-3 w-[150px]" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Skeleton className="h-1.5 w-16 rounded-full" />
                            <Skeleton className="h-4 w-8" />
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Skeleton className="h-1.5 w-16 rounded-full" />
                            <Skeleton className="h-4 w-10" />
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-8 rounded" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
