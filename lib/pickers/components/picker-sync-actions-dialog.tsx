'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { PickerActions } from '@/lib/pickers/schemas/models';

interface PickerSyncActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: PickerActions;
  onSave: (actions: PickerActions) => void;
}

export const PickerSyncActionsDialog: React.FC<
  PickerSyncActionsDialogProps
> = ({ open, onOpenChange, actions, onSave }) => {
  const [like, setLike] = useState(actions.like);
  const [retweet, setRetweet] = useState(actions.retweet);
  const [quote, setQuote] = useState(actions.quote);
  const [reply, setReply] = useState(actions.reply);

  const hasChanges =
    like !== actions.like ||
    retweet !== actions.retweet ||
    quote !== actions.quote ||
    reply !== actions.reply;

  const atLeastOneSelected = like || retweet || quote || reply;

  const handleSave = () => {
    if (!atLeastOneSelected) {
      return;
    }
    onSave({
      pickerId: actions.pickerId,
      like,
      retweet,
      quote,
      reply
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Actions</DialogTitle>
          <DialogDescription>
            Select which Twitter actions to import as picker entries.
          </DialogDescription>
        </DialogHeader>

        {hasChanges && (
          <Alert variant="error">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Changing these settings may delay picker results as we need to
              re-scan the Twitter post for new entries. This process respects
              Twitter's rate limits (1 request per 15 minutes).
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="like" className="text-base">
                ❤️ Likes
              </Label>
              <p className="text-sm text-muted-foreground">
                Import users who liked the post
              </p>
            </div>
            <Switch id="like" checked={like} onCheckedChange={setLike} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="retweet" className="text-base">
                🔁 Retweets
              </Label>
              <p className="text-sm text-muted-foreground">
                Import users who retweeted the post
              </p>
            </div>
            <Switch
              id="retweet"
              checked={retweet}
              onCheckedChange={setRetweet}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quote" className="text-base">
                💬 Quotes
              </Label>
              <p className="text-sm text-muted-foreground">
                Import users who quote tweeted the post
              </p>
            </div>
            <Switch id="quote" checked={quote} onCheckedChange={setQuote} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reply" className="text-base">
                💭 Replies
              </Label>
              <p className="text-sm text-muted-foreground">
                Import users who replied to the post
              </p>
            </div>
            <Switch id="reply" checked={reply} onCheckedChange={setReply} />
          </div>

          {!atLeastOneSelected && (
            <Alert>
              <AlertDescription>
                At least one action must be selected.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!atLeastOneSelected}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
