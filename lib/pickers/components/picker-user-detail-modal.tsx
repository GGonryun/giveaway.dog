'use client';

import React from 'react';

import { Dog, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { PickerActionDisplay } from './picker-action-display';

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
  repostCount: number;
  quoteCount: number;
  replyCount: number;
  filteredEntries: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

interface PickerUserDetailModalProps {
  user: PickerUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PickerUserDetailModal: React.FC<PickerUserDetailModalProps> = ({
  user,
  open,
  onOpenChange
}) => {
  if (!user) return null;

  const handleToggleBlacklist = (checked: boolean) => {
    console.log('Toggle blacklist for user:', user.twitterUserId, checked);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View and manage participant information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.twitterProfileImageUrl ?? undefined} />
              <AvatarFallback>
                {user.twitterDisplayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {user.twitterDisplayName}
                </h3>
                {user.isVerifiedUser && (
                  <Dog className="h-5 w-5 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                @{user.twitterUsername}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Entries
                </p>
                <p className="text-2xl font-bold">{user.totalEntries}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Filtered
                </p>
                <p className="text-2xl font-bold">{user.filteredEntries}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Actions Breakdown
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <PickerActionDisplay action="like" />
                  <span className="font-semibold">{user.likeCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <PickerActionDisplay action="repost" />
                  <span className="font-semibold">{user.repostCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <PickerActionDisplay action="quote" />
                  <span className="font-semibold">{user.quoteCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <PickerActionDisplay action="reply" />
                  <span className="font-semibold">{user.replyCount}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">First Seen</span>
                <span className="font-medium">
                  {format(user.firstSeenAt, 'MMM d, yyyy HH:mm')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Seen</span>
                <span className="font-medium">
                  {format(user.lastSeenAt, 'MMM d, yyyy HH:mm')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="blacklist" className="text-base">
                  Blacklist User
                </Label>
                <p className="text-sm text-muted-foreground">
                  Prevent this user from entering giveaways
                </p>
              </div>
              <Switch
                id="blacklist"
                checked={user.isBlacklisted}
                onCheckedChange={handleToggleBlacklist}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" asChild>
            <a
              href={`https://x.com/${user.twitterUsername}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on X
            </a>
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
