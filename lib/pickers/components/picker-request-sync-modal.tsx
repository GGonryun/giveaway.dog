'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface PickerRequestSyncModalProps {
  pickerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PickerRequestSyncModal: React.FC<PickerRequestSyncModalProps> = ({
  pickerId,
  open,
  onOpenChange
}) => {
  const [endpoints, setEndpoints] = useState({
    likes: false,
    retweets: false,
    quotes: false,
    replies: false
  });
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = (endpoint: keyof typeof endpoints) => {
    setEndpoints((prev) => ({ ...prev, [endpoint]: !prev[endpoint] }));
  };

  const hasSelectedEndpoints = Object.values(endpoints).some((v) => v);

  const handleSubmit = async () => {
    if (!hasSelectedEndpoints) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log('Requesting sync for:', {
      pickerId,
      endpoints: Object.entries(endpoints)
        .filter(([, enabled]) => enabled)
        .map(([endpoint]) => endpoint),
      priority
    });
    setIsSubmitting(false);
    onOpenChange(false);

    setEndpoints({
      likes: false,
      retweets: false,
      quotes: false,
      replies: false
    });
    setPriority('normal');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Sync</DialogTitle>
          <DialogDescription>
            Schedule new jobs to fetch data from X API endpoints
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Select Endpoints
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="likes" className="text-sm font-medium">
                      ❤️ Likes
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Fetch users who liked the post
                    </p>
                  </div>
                  <Switch
                    id="likes"
                    checked={endpoints.likes}
                    onCheckedChange={() => handleToggle('likes')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="retweets" className="text-sm font-medium">
                      🔁 Retweets
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Fetch users who retweeted the post
                    </p>
                  </div>
                  <Switch
                    id="retweets"
                    checked={endpoints.retweets}
                    onCheckedChange={() => handleToggle('retweets')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="quotes" className="text-sm font-medium">
                      💬 Quotes
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Fetch quote tweets of the post
                    </p>
                  </div>
                  <Switch
                    id="quotes"
                    checked={endpoints.quotes}
                    onCheckedChange={() => handleToggle('quotes')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="replies" className="text-sm font-medium">
                      💭 Replies
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Fetch replies to the post
                    </p>
                  </div>
                  <Switch
                    id="replies"
                    checked={endpoints.replies}
                    onCheckedChange={() => handleToggle('replies')}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as typeof priority)}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    Low - Process when available
                  </SelectItem>
                  <SelectItem value="normal">
                    Normal - Standard queue
                  </SelectItem>
                  <SelectItem value="high">
                    High - Priority processing
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Higher priority jobs are processed first
              </p>
            </div>
          </div>

          {!hasSelectedEndpoints && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select at least one endpoint to sync
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sync jobs respect X API rate limits. Processing may take time
              depending on queue and available quota.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasSelectedEndpoints || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              'Schedule Jobs'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
