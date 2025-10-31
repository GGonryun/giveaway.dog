'use client';

import React, { useState } from 'react';
import { useUpdateParams } from '@/components/hooks/use-update-params';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dog, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { PickerUserDetailModal } from './picker-user-detail-modal';
import { useSearchParams } from 'next/navigation';

interface PickerUser {
  id: string;
  pickerId: string;
  twitterUserId: string;
  twitterUsername: string;
  twitterDisplayName: string;
  twitterProfileImageUrl: string | null;
  isVerifiedUser: boolean;
  isBlacklisted: boolean;
  totalEntries: number;
  likeCount: number;
  retweetCount: number;
  quoteCount: number;
  replyCount: number;
  filteredEntries: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

interface PickerUsersProps {
  users: PickerUser[];
}

export const PickerUsers: React.FC<PickerUsersProps> = ({ users }) => {
  const [selectedUser, setSelectedUser] = useState<PickerUser | null>(null);

  const handleToggleBlacklisted = (checked: boolean) => {
    alert('TODO: implement show blacklisted users filter');
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              id="show-blacklisted"
              checked={false}
              onCheckedChange={handleToggleBlacklisted}
            />
            <Label htmlFor="show-blacklisted" className="cursor-pointer">
              Show Blacklisted Users
            </Label>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>First Seen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={user.twitterProfileImageUrl ?? undefined}
                          />
                          <AvatarFallback>
                            {user.twitterDisplayName
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {user.twitterDisplayName}
                            </span>
                            {user.isVerifiedUser && (
                              <Dog className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            @{user.twitterUsername}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">
                          {user.totalEntries} total
                        </span>
                        {user.filteredEntries > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {user.filteredEntries} filtered
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.likeCount > 0 && (
                          <Badge variant="outline">❤️ {user.likeCount}</Badge>
                        )}
                        {user.retweetCount > 0 && (
                          <Badge variant="outline">
                            🔁 {user.retweetCount}
                          </Badge>
                        )}
                        {user.quoteCount > 0 && (
                          <Badge variant="outline">💬 {user.quoteCount}</Badge>
                        )}
                        {user.replyCount > 0 && (
                          <Badge variant="outline">💭 {user.replyCount}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(user.firstSeenAt, 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.isBlacklisted ? (
                        <Badge variant="destructive">Blacklisted</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          View
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`https://x.com/${user.twitterUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <PickerUserDetailModal
        user={selectedUser}
        open={selectedUser !== null}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      />
    </>
  );
};
